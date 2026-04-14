import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Overlay = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(5px);
  z-index: 1000;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: #1e1e1e;
  border-radius: 16px;
  width: 100%;
  max-width: 900px;
  display: flex;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 768px) {
    flex-direction: column;
    max-height: 90vh;
    overflow-y: auto;
  }
`;

const PreviewSection = styled.div`
  flex: 2;
  padding: 30px;
  background: #121212;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const SettingsSection = styled.div`
  flex: 1;
  padding: 30px;
  background: #1e1e1e;
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h2`
  margin: 0 0 20px 0;
  font-size: 1.5rem;
  font-weight: 600;
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const VideoBox = styled.div<{ bgColor: string }>`
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  background: ${props => props.bgColor.startsWith('#') ? props.bgColor : 'linear-gradient(135deg, #000428 0%, #004e92 100%)'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
  position: relative;
  overflow: hidden;
`;

const PreviewTitle = styled.div<{ color: string }>`
  font-size: 2rem;
  font-weight: bold;
  color: ${props => props.color};
  margin-bottom: 5px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.8);
`;

const PreviewArtist = styled.div<{ color: string }>`
  font-size: 1.2rem;
  color: ${props => props.color};
  margin-bottom: 30px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.8);
`;

const LyricLine = styled.div<{ baseColor: string }>`
  font-size: 1.8rem;
  font-weight: bold;
  color: ${props => props.baseColor};
  text-align: center;
  text-shadow: 0 2px 4px rgba(0,0,0,0.8);
  position: relative;
`;

const HighlightedText = styled.span<{ highlightColor: string }>`
  color: ${props => props.highlightColor};
`;

const SettingGroup = styled.div`
  margin-bottom: 25px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 10px;
  font-size: 0.9rem;
  color: #ccc;
  font-weight: 500;
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  
  input[type="color"] {
    appearance: none;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    background: none;
    
    &::-webkit-color-swatch-wrapper {
      padding: 0;
    }
    
    &::-webkit-color-swatch {
      border: 2px solid rgba(255,255,255,0.2);
      border-radius: 50%;
    }
  }

  input[type="text"] {
    flex: 1;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: white;
    padding: 10px 15px;
    border-radius: 8px;
    outline: none;
    font-family: monospace;
    &:focus {
      border-color: #FF8E53;
    }
  }
`;

const PresetTokens = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
`;

const ColorToken = styled.button<{ color: string }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.2);
  background: ${props => props.color};
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.2);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  margin-top: auto;
  padding-top: 20px;
`;

const Button = styled.button<{ primary?: boolean }>`
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  
  ${props => props.primary ? `
    background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
    color: white;
    &:hover {
      opacity: 0.9;
      transform: translateY(-2px);
    }
  ` : `
    background: rgba(255,255,255,0.1);
    color: white;
    &:hover {
      background: rgba(255,255,255,0.2);
    }
  `}
`;

interface VideoVariant {
  id: string;
  bg_color: string;
  text_color: string;
  karaoke_color: string;
  song_title: string;
}

interface VideoSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
  existingVariants?: VideoVariant[];
  onUseExisting?: (variantId: string) => void;
  onGenerate: (colors: { bgColor: string, textColor: string, karaokeColor: string }) => void;
}

export const VideoSettingsModal: React.FC<VideoSettingsModalProps> = ({ isOpen, onClose, jobId, existingVariants, onUseExisting, onGenerate }) => {
  const [bgColor, setBgColor] = useState('#000000');
  const [useGradient, setUseGradient] = useState(true);
  const [textColor, setTextColor] = useState('#ffffff');
  const [karaokeColor, setKaraokeColor] = useState('#ff0055');
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setBgColor('#000000');
      setUseGradient(true);
      setTextColor('#ffffff');
      setKaraokeColor('#ff0055');
      setSelectedVariantId(null);
    }
  }, [isOpen]);

  // We need to convert standard hex colors to ASS format (&H00BBGGRR) when submitting
  const convertToASS = (hex: string) => {
    // hex is like #RRGGBB
    const r = hex.slice(1, 3);
    const g = hex.slice(3, 5);
    const b = hex.slice(5, 7);
    return `&H00${b}${g}${r}`;
  };

  const assToHex = (ass: string) => {
    if (!ass.startsWith('&H00')) return ass;
    const b = ass.slice(4, 6);
    const g = ass.slice(6, 8);
    const r = ass.slice(8, 10);
    return `#${r}${g}${b}`;
  };

  const handleColorChange = (setter: any, value: any) => {
    setter(value);
    setSelectedVariantId(null); // Deselect variant if user manually edits
  };

  const handleGenerate = () => {
    // Send standard formats or ASS format depending on backend expectation
    onGenerate({
      bgColor: useGradient ? 'gradient' : bgColor,
      textColor: convertToASS(textColor),
      karaokeColor: convertToASS(karaokeColor)
    });
  };

  return (
    <Overlay isOpen={isOpen}>
      <ModalContent>
        <PreviewSection>
          <div style={{ width: '100%', marginBottom: '20px' }}>
            <h3 style={{ color: '#fff', opacity: 0.8, fontWeight: 500, fontSize: '1.2rem', margin: 0 }}>Live Preview</h3>
            <p style={{ color: '#aaa', fontSize: '0.9rem', margin: '5px 0 0 0' }}>This is how your video will look</p>
          </div>
          <VideoBox bgColor={useGradient ? 'gradient' : bgColor}>
            <PreviewTitle color={textColor}>Song Title</PreviewTitle>
            <PreviewArtist color={textColor}>Artist Name</PreviewArtist>
            <LyricLine baseColor={textColor}>
              This is a <HighlightedText highlightColor={karaokeColor}>sample lyric</HighlightedText> line
            </LyricLine>
          </VideoBox>
        </PreviewSection>

        <SettingsSection>
          <Title>Video Settings</Title>

          {existingVariants && existingVariants.length > 0 && (
            <SettingGroup>
              <Label style={{ color: '#FF8E53', fontWeight: 'bold' }}>Previously Generated Styles</Label>
              {existingVariants.map(variant => {
                const tColor = variant.text_color.startsWith('&H') ? assToHex(variant.text_color) : variant.text_color;
                const kColor = variant.karaoke_color.startsWith('&H') ? assToHex(variant.karaoke_color) : variant.karaoke_color;

                return (
                  <div
                    key={variant.id}
                    onClick={() => {
                      setBgColor(variant.bg_color === 'gradient' ? '#000000' : variant.bg_color);
                      setUseGradient(variant.bg_color === 'gradient');
                      setTextColor(tColor);
                      setKaraokeColor(kColor);
                      setSelectedVariantId(variant.id);
                    }}
                    style={{
                      background: selectedVariantId === variant.id ? 'rgba(255,142,83,0.1)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${selectedVariantId === variant.id ? '#FF8E53' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px', padding: '10px', marginBottom: '10px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '10px'
                    }}
                  >
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '6px',
                      background: variant.bg_color.startsWith('#') ? variant.bg_color : 'linear-gradient(135deg, #000428 0%, #004e92 100%)',
                      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      <div style={{ width: '60%', height: '4px', background: tColor, marginBottom: '4px', borderRadius: '2px' }} />
                      <div style={{ width: '40%', height: '4px', background: kColor, borderRadius: '2px' }} />
                    </div>
                    <div style={{ flex: 1, fontSize: '0.85rem', color: '#ddd' }}>
                      Select this style to skip generation time and instantly reuse!
                    </div>
                  </div>
                );
              })}
            </SettingGroup>
          )}

          <SettingGroup>
            <Label>Background</Label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <Button primary={useGradient} onClick={() => handleColorChange(setUseGradient, true)} style={{ padding: '8px' }}>
                Gradient
              </Button>
              <Button primary={!useGradient} onClick={() => handleColorChange(setUseGradient, false)} style={{ padding: '8px' }}>
                Solid Color
              </Button>
            </div>
            {!useGradient && (
              <InputRow>
                <input type="color" value={bgColor} onChange={e => handleColorChange(setBgColor, e.target.value)} />
                <input type="text" value={bgColor} onChange={e => handleColorChange(setBgColor, e.target.value)} />
              </InputRow>
            )}
          </SettingGroup>

          <SettingGroup>
            <Label>Base Text Color</Label>
            <InputRow>
              <input type="color" value={textColor} onChange={e => handleColorChange(setTextColor, e.target.value)} />
              <input type="text" value={textColor} onChange={e => handleColorChange(setTextColor, e.target.value)} />
            </InputRow>
            <PresetTokens>
              {['#ffffff', '#f8f9fa', '#e9ecef', '#ffff00', '#00ffff'].map(c => (
                <ColorToken key={c} color={c} onClick={() => handleColorChange(setTextColor, c)} />
              ))}
            </PresetTokens>
          </SettingGroup>

          <SettingGroup>
            <Label>Highlight (Karaoke) Color</Label>
            <InputRow>
              <input type="color" value={karaokeColor} onChange={e => handleColorChange(setKaraokeColor, e.target.value)} />
              <input type="text" value={karaokeColor} onChange={e => handleColorChange(setKaraokeColor, e.target.value)} />
            </InputRow>
            <PresetTokens>
              {['#ff0055', '#ff0000', '#00ff00', '#ffaa00', '#8a2be2'].map(c => (
                <ColorToken key={c} color={c} onClick={() => handleColorChange(setKaraokeColor, c)} />
              ))}
            </PresetTokens>
          </SettingGroup>

          <ButtonGroup>
            <Button onClick={onClose}>Cancel</Button>
            {selectedVariantId ? (
              <Button primary onClick={() => onUseExisting?.(selectedVariantId)}>Instantly Re-use Video Component</Button>
            ) : (
              <Button primary onClick={handleGenerate}>Render Video</Button>
            )}
          </ButtonGroup>
        </SettingsSection>
      </ModalContent>
    </Overlay>
  );
};
