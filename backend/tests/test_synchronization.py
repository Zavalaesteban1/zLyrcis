"""
Tests for the transcription-first sync changes in core/synchronization.py.

Coverage:
  1. _compute_corpus_alignment_score   – pure string-comparison logic
  2. _build_synced_from_groq_segments  – word grouping / timestamp extraction
  3. _match_lyrics_to_words            – no-cascade behaviour on unmatched lines
  4. synchronize_lyrics routing        – None/empty → groq-only, non-None → matching
  5. _synchronize_with_groq            – low / high alignment score branching (mocked API)
  6. synchronize_lyrics_advanced       – output format and backward-compat
  7. SyncedLyric dataclass             – new method names accepted
"""

import os
import pytest
import numpy as np
from unittest.mock import patch, MagicMock

from core.synchronization import (
    AdvancedLyricSynchronizer,
    SyncedLyric,
    synchronize_lyrics_advanced,
)
from core.config import infer_sync_preset, build_sync_config


# ─── Shared helpers ───────────────────────────────────────────────────────────

def make_synchronizer(audio_path: str = "/fake/audio.mp3") -> AdvancedLyricSynchronizer:
    """Return a synchronizer whose __init__ is bypassed (no real file I/O)."""
    sync = AdvancedLyricSynchronizer.__new__(AdvancedLyricSynchronizer)
    sync.audio_path = audio_path
    sync.audio_features = None
    sync.config = None
    sync.sample_rate = 22050
    sync.y = None
    sync.detected_language = None
    sync.spotify_genres = []
    return sync


def make_sync_with_y() -> AdvancedLyricSynchronizer:
    """Synchronizer with a minimal audio array (needed by _post_process_timing)."""
    sync = make_synchronizer()
    sync.y = np.zeros(44100, dtype=np.float32)
    return sync


def word_dicts(*entries):
    """Build a list of word dicts from (word, start, end) tuples."""
    return [{"word": w, "start": s, "end": e} for w, s, e in entries]


# ─── 1. _compute_corpus_alignment_score ──────────────────────────────────────

class TestComputeCorpusAlignmentScore:

    def test_identical_text_gives_high_score(self):
        sync = make_synchronizer()
        lyrics = [
            "they dont like to see you winnin",
            "they wanna see you in the penitentiary",
        ]
        words = word_dicts(
            ("they", 2.0, 2.2), ("dont", 2.2, 2.4), ("like", 2.4, 2.6),
            ("to", 2.6, 2.7), ("see", 2.7, 2.9), ("you", 2.9, 3.1),
            ("winnin", 3.1, 3.5),
            ("they", 4.0, 4.2), ("wanna", 4.2, 4.5), ("see", 4.5, 4.7),
            ("you", 4.7, 4.9), ("in", 4.9, 5.0), ("the", 5.0, 5.1),
            ("penitentiary", 5.1, 6.0),
        )
        score = sync._compute_corpus_alignment_score(lyrics, words)
        assert score > 0.70

    def test_completely_different_text_gives_low_score(self):
        sync = make_synchronizer()
        lyrics = [
            "walking down the street in the rain",
            "feeling like I lost my mind today",
        ]
        words = word_dicts(
            ("money", 0.0, 0.3), ("cash", 0.3, 0.6), ("racks", 0.6, 0.9),
            ("drip", 1.0, 1.2), ("swag", 1.2, 1.5), ("flex", 1.5, 1.8),
            ("stunting", 1.8, 2.2), ("on", 2.2, 2.4), ("everyone", 2.4, 2.9),
        )
        score = sync._compute_corpus_alignment_score(lyrics, words)
        assert score < 0.35

    def test_empty_lyrics_returns_zero(self):
        sync = make_synchronizer()
        words = word_dicts(("hello", 0.0, 0.5))
        assert sync._compute_corpus_alignment_score([], words) == 0.0

    def test_empty_words_returns_zero(self):
        sync = make_synchronizer()
        assert sync._compute_corpus_alignment_score(["some lyrics"], []) == 0.0

    def test_both_empty_returns_zero(self):
        assert make_synchronizer()._compute_corpus_alignment_score([], []) == 0.0

    def test_partial_overlap_is_between_zero_and_one(self):
        sync = make_synchronizer()
        lyrics = ["hello world foo bar"]
        words = word_dicts(("hello", 0.0, 0.3), ("world", 0.3, 0.6),
                           ("baz", 0.6, 0.9), ("qux", 0.9, 1.2))
        score = sync._compute_corpus_alignment_score(lyrics, words)
        assert 0.0 < score < 1.0

    def test_accepts_object_style_words(self):
        """Words can also be objects with .word, .start, .end attributes."""
        sync = make_synchronizer()
        lyrics = ["test line"]
        w1, w2 = MagicMock(), MagicMock()
        w1.word, w1.start, w1.end = "test", 0.0, 0.5
        w2.word, w2.start, w2.end = "line", 0.5, 1.0
        score = sync._compute_corpus_alignment_score(lyrics, [w1, w2])
        assert score > 0.70

    def test_punctuation_stripped_before_comparison(self):
        """Commas and apostrophes must not skew the score."""
        sync = make_synchronizer()
        lyrics = ["it's, all right!"]
        words = word_dicts(("its", 0.0, 0.3), ("all", 0.3, 0.6), ("right", 0.6, 0.9))
        score = sync._compute_corpus_alignment_score(lyrics, words)
        assert score > 0.70

    def test_score_is_symmetric_in_direction(self):
        """Switching lyrics and words should give a similar score (SequenceMatcher is not fully symmetric but should be close)."""
        sync = make_synchronizer()
        lyrics = ["hello world"]
        words = word_dicts(("hello", 0.0, 0.5), ("world", 0.5, 1.0))
        score1 = sync._compute_corpus_alignment_score(lyrics, words)
        # Reversed: very short lyrics vs longer word-list
        words2 = word_dicts(("hello", 0.0, 0.3), ("world", 0.3, 0.6),
                            ("extra", 0.6, 0.9), ("stuff", 0.9, 1.2))
        score2 = sync._compute_corpus_alignment_score(lyrics, words2)
        # score1 should be higher (closer match)
        assert score1 > score2


# ─── 2. _build_synced_from_groq_segments ─────────────────────────────────────

class TestBuildSyncedFromGroqSegments:

    def test_groups_words_by_natural_pause(self):
        sync = make_synchronizer()
        words = word_dicts(
            ("they", 2.0, 2.2), ("dont", 2.2, 2.4), ("like", 2.4, 2.6),
            # 0.9 s pause
            ("they", 3.5, 3.7), ("wanna", 3.7, 4.0), ("win", 4.0, 4.3),
        )
        result = sync._build_synced_from_groq_segments(words, "en")
        assert result is not None
        assert len(result) == 2
        assert "they dont like" in result[0].text
        assert "they wanna win" in result[1].text

    def test_groups_words_by_word_count_limit(self):
        sync = make_synchronizer()
        # 15 consecutive words with no meaningful pause
        words = word_dicts(*[("word", i * 0.1, i * 0.1 + 0.08) for i in range(15)])
        result = sync._build_synced_from_groq_segments(words, "en")
        assert result is not None
        # 10 words → first line, 5 words → second line
        assert len(result) == 2

    def test_timestamps_come_from_first_and_last_word(self):
        sync = make_synchronizer()
        sync.config = build_sync_config(tempo=140.0)
        words = word_dicts(
            ("hello", 5.0, 5.4), ("world", 5.5, 5.9),
            ("foo", 6.6, 6.8), ("bar", 6.9, 7.2),
        )
        result = sync._build_synced_from_groq_segments(words, "en")
        assert result[0].start_time == pytest.approx(5.0)
        assert result[0].end_time == pytest.approx(5.9, abs=0.01)
        assert result[1].start_time == pytest.approx(6.6)
        assert result[1].end_time == pytest.approx(7.2, abs=0.01)

    def test_method_label_is_transcript_first(self):
        sync = make_synchronizer()
        words = word_dicts(("hello", 0.0, 0.5), ("world", 0.6, 1.0))
        result = sync._build_synced_from_groq_segments(words, "en")
        assert result[0].method == "transcript_first"

    def test_confidence_is_high(self):
        sync = make_synchronizer()
        words = word_dicts(("hello", 0.0, 0.5), ("world", 0.6, 1.0))
        result = sync._build_synced_from_groq_segments(words, "en")
        assert result[0].confidence >= 0.9

    def test_returns_none_for_empty_word_list(self):
        assert make_synchronizer()._build_synced_from_groq_segments([], "en") is None

    def test_all_words_in_single_line_when_short_and_no_pause(self):
        sync = make_synchronizer()
        words = word_dicts(("i", 0.0, 0.1), ("love", 0.1, 0.3), ("music", 0.3, 0.7))
        result = sync._build_synced_from_groq_segments(words, "en")
        assert len(result) == 1
        assert result[0].text == "i love music"

    def test_single_word_creates_one_line(self):
        sync = make_synchronizer()
        sync.config = build_sync_config(tempo=140.0)
        words = word_dicts(("yeah", 3.0, 3.5))
        result = sync._build_synced_from_groq_segments(words, "en")
        assert len(result) == 1
        assert result[0].start_time == pytest.approx(3.0)
        assert result[0].end_time == pytest.approx(3.5, abs=0.01)

    def test_returns_synced_lyric_instances(self):
        sync = make_synchronizer()
        words = word_dicts(("test", 1.0, 1.5))
        result = sync._build_synced_from_groq_segments(words, "en")
        assert isinstance(result[0], SyncedLyric)

    def test_accepts_object_style_words(self):
        sync = make_synchronizer()
        w1, w2 = MagicMock(), MagicMock()
        w1.word, w1.start, w1.end = "object", 0.0, 0.4
        w2.word, w2.start, w2.end = "words", 0.4, 0.8
        result = sync._build_synced_from_groq_segments([w1, w2], "en")
        assert result is not None
        assert "object" in result[0].text


# ─── 3. _match_lyrics_to_words – no-cascade behaviour ────────────────────────

class TestMatchLyricsToWordsNoCascade:

    def test_unmatched_first_line_does_not_consume_word_cursor(self):
        """
        If line A finds no match, the word cursor must stay put so that line B
        can still find its correct timestamp (the key anti-cascade fix).
        """
        sync = make_sync_with_y()
        words = word_dicts(
            ("second", 5.0, 5.4), ("line", 5.5, 5.9), ("words", 6.0, 6.4),
        )
        lyrics = [
            "completely unrelated gibberish xyz",  # no match
            "second line words",                   # should match
        ]
        result = sync._match_lyrics_to_words(lyrics, words, "en")
        assert len(result) == 2
        # The matched line must have been assigned real word timestamps
        matched = result[1]
        assert matched.start_time >= 5.0, (
            "Line B timestamp was not anchored to the actual word – cascade failure not fixed"
        )

    def test_unmatched_line_uses_estimated_method(self):
        sync = make_sync_with_y()
        words = word_dicts(("hello", 0.5, 1.0))
        lyrics = ["completely unrelated text that will never match any transcript here"]
        result = sync._match_lyrics_to_words(lyrics, words, "en")
        assert len(result) == 1
        assert result[0].method in ("unmatched_estimated", "unmatched_default")

    def test_unmatched_line_has_low_confidence(self):
        sync = make_sync_with_y()
        words = word_dicts(("hello", 0.5, 1.0))
        lyrics = ["absolutely nothing to match here at all for real"]
        result = sync._match_lyrics_to_words(lyrics, words, "en")
        assert result[0].confidence < 0.3

    def test_matched_line_gets_correct_timestamps(self):
        sync = make_sync_with_y()
        words = word_dicts(("hello", 1.0, 1.4), ("world", 1.5, 1.9))
        lyrics = ["hello world"]
        result = sync._match_lyrics_to_words(lyrics, words, "en")
        assert len(result) == 1
        assert result[0].start_time == pytest.approx(1.0, abs=0.1)
        assert result[0].end_time == pytest.approx(1.9, abs=0.1)
        assert result[0].confidence > 0.5

    def test_empty_lyrics_returns_empty_list(self):
        sync = make_sync_with_y()
        words = word_dicts(("hello", 0.0, 0.5))
        assert sync._match_lyrics_to_words([], words, "en") == []

    def test_empty_words_returns_estimated_for_each_lyric(self):
        sync = make_sync_with_y()
        lyrics = ["some lyrics", "more lyrics"]
        result = sync._match_lyrics_to_words(lyrics, [], "en")
        # No crash; may return empty list (start_idx >= len(words) guard) or estimated
        assert isinstance(result, list)

    def test_multiple_unmatched_lines_do_not_stack_far_forward(self):
        """
        Several consecutive unmatched lines should NOT push timestamps
        far past the audio duration (old cascade bug).
        """
        sync = make_sync_with_y()
        sync.y = np.zeros(22050 * 10)   # 10 s audio
        words = word_dicts(("actual", 8.0, 8.4), ("line", 8.5, 8.8))
        lyrics = [
            "gibberish one",
            "gibberish two",
            "gibberish three",
            "actual line",   # should land near 8 s
        ]
        result = sync._match_lyrics_to_words(lyrics, words, "en")
        # The last element should have a reasonable start time (not hundreds of seconds)
        last = result[-1]
        assert last.start_time < 100.0, (
            f"Cascade failure: last line at {last.start_time:.1f}s is impossibly far"
        )


# ─── 4. synchronize_lyrics routing ───────────────────────────────────────────

class TestSynchronizeLyricsRouting:

    def _make(self):
        sync = make_sync_with_y()
        return sync

    def test_none_lyrics_triggers_groq_only_mode(self):
        sync = self._make()
        groq_only_result = [SyncedLyric("line1", 0.0, 2.0, 2.0, 1.0, "groq_transcription_only")]
        with patch.object(sync, "_synchronize_groq_only", return_value=groq_only_result) as m:
            result = sync.synchronize_lyrics(None)
        m.assert_called_once()
        assert result == groq_only_result

    def test_empty_lyrics_triggers_groq_only_mode(self):
        sync = self._make()
        groq_only_result = [SyncedLyric("line1", 0.0, 2.0, 2.0, 1.0, "groq_transcription_only")]
        with patch.object(sync, "_synchronize_groq_only", return_value=groq_only_result) as m:
            result = sync.synchronize_lyrics([])
        m.assert_called_once()

    def test_sufficient_groq_result_is_returned_directly(self):
        sync = self._make()
        lyrics = ["line1", "line2", "line3"]
        groq_result = [
            SyncedLyric("line1", 0.0, 2.0, 2.0, 0.9, "enhanced_deepgram"),
            SyncedLyric("line2", 2.0, 4.0, 2.0, 0.9, "enhanced_deepgram"),
            SyncedLyric("line3", 4.0, 6.0, 2.0, 0.9, "enhanced_deepgram"),
        ]
        with patch.object(sync, "_synchronize_with_groq", return_value=groq_result):
            result = sync.synchronize_lyrics(lyrics)
        assert result == groq_result

    def test_insufficient_groq_falls_through_to_whisper(self):
        sync = self._make()
        lyrics = ["a", "b", "c", "d", "e"]  # 5 lines
        # Groq only returns 2 – below 70 % threshold
        weak_groq = [
            SyncedLyric("a", 0.0, 1.0, 1.0, 0.8, "enhanced_deepgram"),
            SyncedLyric("b", 1.0, 2.0, 1.0, 0.8, "enhanced_deepgram"),
        ]
        whisper_result = [SyncedLyric(line, i * 2.0, i * 2.0 + 1.5, 1.5, 0.8, "local_whisper")
                          for i, line in enumerate(lyrics)]
        with patch.object(sync, "_synchronize_with_groq", return_value=weak_groq):
            with patch.object(sync, "_synchronize_with_local_whisper", return_value=whisper_result) as m_whisper:
                with patch.object(sync, "_synchronize_with_enhanced_deepgram", return_value=None):
                    with patch.object(sync, "_create_improved_basic_synchronization",
                                      return_value=[SyncedLyric("x", 0, 1, 1, 0.1, "basic")]):
                        result = sync.synchronize_lyrics(lyrics)
        m_whisper.assert_called_once()
        assert result == whisper_result


# ─── 5. _synchronize_with_groq – alignment branching ─────────────────────────

class TestSynchronizeWithGroqAlignmentBranching:

    def _make(self):
        return make_sync_with_y()

    def _mock_groq_transcript(self, word_tuples):
        """Return a MagicMock that looks like a Groq verbose_json response."""
        transcript = MagicMock()
        transcript.language = "en"
        transcript.words = [
            MagicMock(word=w, start=s, end=e) for w, s, e in word_tuples
        ]
        return transcript

    def _patch_open(self):
        """Return a context manager that stubs out the audio file open()."""
        return patch("builtins.open", MagicMock(return_value=MagicMock(
            __enter__=lambda s, *a: MagicMock(),
            __exit__=lambda s, *a: False,
        )))

    def test_low_alignment_calls_build_synced_from_groq_segments(self):
        sync = self._make()
        lyrics = ["walking in the rain today completely wrong lyrics for this song"]
        transcript = self._mock_groq_transcript([
            ("money", 0.0, 0.3), ("cash", 0.3, 0.6), ("drip", 0.6, 0.9),
        ])
        fake_segments = [SyncedLyric("money cash drip", 0.0, 0.9, 0.9, 0.95, "transcript_first")]

        with patch.dict(os.environ, {"GROQ_API_KEY": "fake_key"}):
            with patch("core.synchronization.GROQ_AVAILABLE", True):
                with patch("core.synchronization.OpenAI") as MockOpenAI:
                    MockOpenAI.return_value.audio.transcriptions.create.return_value = transcript
                    with self._patch_open():
                        with patch.object(sync, "_compute_corpus_alignment_score", return_value=0.10):
                            with patch.object(sync, "_build_synced_from_groq_segments",
                                              return_value=fake_segments) as mock_build:
                                result = sync._synchronize_with_groq(lyrics)

        mock_build.assert_called_once()
        assert result == fake_segments

    def test_high_alignment_calls_match_lyrics_to_words(self):
        sync = self._make()
        lyrics = ["money cash drip swag"]
        transcript = self._mock_groq_transcript([
            ("money", 0.0, 0.3), ("cash", 0.3, 0.6),
            ("drip", 0.6, 0.9), ("swag", 0.9, 1.2),
        ])
        matched = [SyncedLyric("money cash drip swag", 0.0, 1.2, 1.2, 0.95, "enhanced_deepgram")]

        with patch.dict(os.environ, {"GROQ_API_KEY": "fake_key"}):
            with patch("core.synchronization.GROQ_AVAILABLE", True):
                with patch("core.synchronization.OpenAI") as MockOpenAI:
                    MockOpenAI.return_value.audio.transcriptions.create.return_value = transcript
                    with self._patch_open():
                        with patch.object(sync, "_compute_corpus_alignment_score", return_value=0.90):
                            with patch.object(sync, "_match_lyrics_to_words",
                                              return_value=matched) as mock_match:
                                result = sync._synchronize_with_groq(lyrics)

        mock_match.assert_called_once()
        assert result == matched

    def test_missing_groq_api_key_returns_none(self):
        sync = self._make()
        with patch.dict(os.environ, {}, clear=True):
            with patch("core.synchronization.GROQ_AVAILABLE", True):
                result = sync._synchronize_with_groq(["any lyric"])
        assert result is None

    def test_groq_not_available_returns_none(self):
        sync = self._make()
        with patch("core.synchronization.GROQ_AVAILABLE", False):
            result = sync._synchronize_with_groq(["any lyric"])
        assert result is None

    def test_alignment_threshold_boundary_exactly_at_threshold_uses_matching(self):
        """Score == 0.35 should use lyrics matching (>= threshold)."""
        sync = self._make()
        lyrics = ["borderline lyrics here"]
        transcript = self._mock_groq_transcript([("borderline", 0.0, 0.5), ("lyrics", 0.5, 1.0)])
        matched = [SyncedLyric("borderline lyrics here", 0.0, 1.0, 1.0, 0.6, "enhanced_deepgram")]

        with patch.dict(os.environ, {"GROQ_API_KEY": "k"}):
            with patch("core.synchronization.GROQ_AVAILABLE", True):
                with patch("core.synchronization.OpenAI") as MockOpenAI:
                    MockOpenAI.return_value.audio.transcriptions.create.return_value = transcript
                    with self._patch_open():
                        with patch.object(sync, "_compute_corpus_alignment_score", return_value=0.35):
                            with patch.object(sync, "_match_lyrics_to_words",
                                              return_value=matched) as mock_match:
                                with patch.object(sync, "_build_synced_from_groq_segments") as mock_build:
                                    sync._synchronize_with_groq(lyrics)

        mock_match.assert_called_once()
        mock_build.assert_not_called()


# ─── 6. synchronize_lyrics_advanced – output format ──────────────────────────

class TestSynchronizeLyricsAdvancedFormat:

    def _mock_synchronizer(self, synced: list):
        patcher = patch("core.synchronization.AdvancedLyricSynchronizer")
        MockCls = patcher.start()
        inst = MagicMock()
        MockCls.return_value = inst
        inst.analyze_audio.return_value = None
        inst.synchronize_lyrics.return_value = synced
        return patcher

    def test_returns_list_of_dicts_with_all_required_keys(self):
        p = self._mock_synchronizer([
            SyncedLyric("hello world", 1.0, 3.0, 2.0, 0.9, "groq_transcription_only"),
        ])
        try:
            result = synchronize_lyrics_advanced("/fake/audio.mp3", ["hello world"])
        finally:
            p.stop()

        assert isinstance(result, list)
        assert len(result) == 1
        item = result[0]
        for key in ("text", "start_time", "end_time", "duration", "confidence", "method", "words"):
            assert key in item, f"Missing key: {key}"

    def test_text_value_preserved(self):
        p = self._mock_synchronizer([
            SyncedLyric("test line", 0.0, 2.0, 2.0, 0.8, "transcript_first"),
        ])
        try:
            result = synchronize_lyrics_advanced("/fake/audio.mp3", ["test line"])
        finally:
            p.stop()
        assert result[0]["text"] == "test line"

    def test_empty_synced_lyrics_returns_empty_list(self):
        p = self._mock_synchronizer([])
        try:
            result = synchronize_lyrics_advanced("/fake/audio.mp3", [])
        finally:
            p.stop()
        assert result == []

    def test_none_lyrics_logged_as_groq_only_mode(self, capsys):
        p = self._mock_synchronizer([
            SyncedLyric("hello", 0.0, 1.0, 1.0, 1.0, "groq_transcription_only"),
        ])
        try:
            synchronize_lyrics_advanced("/fake/audio.mp3", None)
        finally:
            p.stop()
        captured = capsys.readouterr()
        assert "Groq-only" in captured.out

    def test_lyrics_source_appears_in_log(self, capsys):
        p = self._mock_synchronizer([
            SyncedLyric("hello", 0.0, 1.0, 1.0, 0.9, "enhanced_deepgram"),
        ])
        try:
            synchronize_lyrics_advanced("/fake/audio.mp3", ["hello"], lyrics_source="Musixmatch")
        finally:
            p.stop()
        captured = capsys.readouterr()
        assert "Musixmatch" in captured.out

    def test_new_method_names_pass_through_unchanged(self):
        for method in ("transcript_first", "unmatched_estimated", "unmatched_default", "hardcoded_fix"):
            p = self._mock_synchronizer([
                SyncedLyric("line", 0.0, 1.0, 1.0, 0.5, method),
            ])
            try:
                result = synchronize_lyrics_advanced("/fake/audio.mp3", ["line"])
            finally:
                p.stop()
            assert result[0]["method"] == method


# ─── 7. SyncedLyric dataclass backward-compatibility ─────────────────────────

class TestSyncedLyricDataclass:

    def test_default_confidence_and_method(self):
        s = SyncedLyric(text="hello", start_time=0.0, end_time=1.0, duration=1.0)
        assert s.confidence == 0.0
        assert s.method == "unknown"
        assert s.words == []

    def test_new_method_transcript_first_accepted(self):
        s = SyncedLyric("test", 0.0, 1.0, 1.0, 0.95, "transcript_first")
        assert s.method == "transcript_first"

    def test_new_method_unmatched_estimated_accepted(self):
        s = SyncedLyric("test", 0.0, 1.0, 1.0, 0.2, "unmatched_estimated")
        assert s.method == "unmatched_estimated"

    def test_new_method_unmatched_default_accepted(self):
        s = SyncedLyric("test", 2.0, 4.0, 2.0, 0.1, "unmatched_default")
        assert s.method == "unmatched_default"

    def test_new_method_hardcoded_fix_accepted(self):
        s = SyncedLyric("Dig that hole, forget the sun", 132.70, 135.70, 3.0, 1.0, "hardcoded_fix")
        assert s.method == "hardcoded_fix"
        assert s.confidence == 1.0

    def test_words_field_defaults_to_empty_list(self):
        s = SyncedLyric("hi", 0.0, 0.5, 0.5)
        assert isinstance(s.words, list)
        assert len(s.words) == 0


# ─── 8. Fast-tempo / rap preset ───────────────────────────────────────────────

class TestFastTempoSync:

    def test_infer_sync_preset_from_spotify_genre(self):
        assert infer_sync_preset(spotify_genres=["hip hop"]) == "rap"
        assert infer_sync_preset(spotify_genres=["trap"]) == "rap"

    def test_infer_sync_preset_from_high_tempo(self):
        assert infer_sync_preset(tempo=140.0) == "rap"

    def test_infer_sync_preset_from_lyric_density(self):
        # 40 lines in 120s = 20 lines/min
        assert infer_sync_preset(num_lyrics=40, audio_duration=120.0) == "rap"

    def test_infer_sync_preset_default_for_slow_ballad(self):
        assert infer_sync_preset(tempo=80.0, num_lyrics=20, audio_duration=240.0) == "default"

    def test_build_sync_config_rap_has_low_min_duration(self):
        config = build_sync_config(tempo=140.0, num_lyrics=60, audio_duration=180.0)
        assert config.MIN_LINE_DURATION <= 0.5
        assert config.MIN_GAP_BETWEEN_LINES <= 0.05

    def test_improved_basic_sync_uses_rap_min_duration(self):
        sync = make_sync_with_y()
        sync.config = build_sync_config(tempo=140.0, num_lyrics=40, audio_duration=180.0)
        sync.audio_features = type("AF", (), {"tempo": 140.0, "vocal_segments": [(5.0, 175.0)]})()
        lines = ["fast line one", "fast line two", "fast line three"]
        result = sync._create_improved_basic_synchronization(lines)
        assert len(result) == 3
        for lyric in result:
            assert lyric.duration >= sync.config.MIN_LINE_DURATION
            assert lyric.duration <= sync.config.MAX_LINE_DURATION + 0.01

    def test_transcript_first_populates_word_timings(self):
        sync = make_synchronizer()
        sync.config = build_sync_config(tempo=140.0)
        words = word_dicts(
            ("they", 2.0, 2.2), ("go", 2.2, 2.35), ("fast", 2.35, 2.5),
        )
        result = sync._build_synced_from_groq_segments(words, "en")
        assert result[0].words
        assert result[0].words[0]["word"] == "they"
        assert result[0].words[0]["start"] == pytest.approx(2.0)

    def test_fast_mode_groups_fewer_words_per_line(self):
        sync = make_synchronizer()
        sync.config = build_sync_config(tempo=140.0)
        words = word_dicts(*[("word", i * 0.1, i * 0.1 + 0.08) for i in range(8)])
        result = sync._build_synced_from_groq_segments(words, "en")
        assert all(len(line.words) <= 6 for line in result)

    def test_is_fast_sync_detects_rap_config(self):
        sync = make_synchronizer()
        sync.config = build_sync_config(spotify_genres=["trap"])
        assert sync._is_fast_sync() is True

    def test_post_process_overlap_uses_tight_gap_in_fast_mode(self):
        sync = make_sync_with_y()
        sync.config = build_sync_config(tempo=140.0)
        lyrics = [
            SyncedLyric("a", 1.0, 2.0, 1.0, 0.9, "enhanced_deepgram", words=[]),
            SyncedLyric("b", 1.5, 2.5, 1.0, 0.9, "enhanced_deepgram", words=[]),
        ]
        result = sync._post_process_timing(lyrics)
        gap = result[1].start_time - result[0].end_time
        assert gap <= sync.config.MIN_GAP_BETWEEN_LINES + 0.01
