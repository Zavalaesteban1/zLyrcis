import { useState, useEffect, useCallback, useRef } from 'react';
import { getUserProfile, updateProfilePicture, updateProfile, UserProfile } from '../services/api';

interface UseProfileManagerReturn {
  profileData: UserProfile | null;
  editableProfile: Partial<UserProfile> | null;
  isEditMode: boolean;
  loading: boolean;
  error: string | null;
  notification: { message: string; type: 'success' | 'error' } | null;
  selectedFile: File | null;
  uploading: boolean;
  saving: boolean;
  filePreview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  handleEditClick: () => void;
  handleCancelEdit: () => void;
  handleEditChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveProfile: () => Promise<void>;
  setNotification: (notification: { message: string; type: 'success' | 'error' } | null) => void;
}

export const useProfileManager = (): UseProfileManagerReturn => {
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [editableProfile, setEditableProfile] = useState<Partial<UserProfile> | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUserProfile();
      setProfileData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handle file selection for profile picture
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setNotification({
          message: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)',
          type: 'error'
        });
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setNotification({
          message: 'File size must be less than 5MB',
          type: 'error'
        });
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      setNotification({
        message: `Selected file: ${file.name}. Click Upload to save.`,
        type: 'success'
      });
    }
  }, []);

  // Handle profile picture upload
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!selectedFile) {
      console.log('No file selected');
      return;
    }

    try {
      setUploading(true);

      console.log('Uploading file:', selectedFile.name, selectedFile.type, selectedFile.size);

      const updatedProfile = await updateProfilePicture(selectedFile);
      console.log('Profile updated successfully:', updatedProfile);
      setProfileData(updatedProfile);
      setNotification({
        message: 'Profile picture updated successfully!',
        type: 'success'
      });

      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);

      // Clear selected file
      setSelectedFile(null);
      setFilePreview(null);
      // Reset the file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Error details:', err);
      const errorResponse = err.response || {};
      console.error('Error status:', errorResponse.status);
      console.error('Error data:', errorResponse.data);

      const errorMessage = err.response?.data?.error || 'Failed to update profile picture. Please try again.';
      setNotification({
        message: errorMessage,
        type: 'error'
      });
      console.error('Error updating profile picture:', err);
    } finally {
      setUploading(false);
    }
  }, [selectedFile]);

  // Enter edit mode
  const handleEditClick = useCallback(() => {
    setIsEditMode(true);
    setEditableProfile({
      name: profileData?.name || '',
      role: profileData?.role || '',
      email: profileData?.email || ''
    });
  }, [profileData]);

  // Cancel edit mode
  const handleCancelEdit = useCallback(() => {
    setIsEditMode(false);
    setEditableProfile(null);
  }, []);

  // Handle input changes in edit mode
  const handleEditChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditableProfile(prev => prev ? { ...prev, [name]: value } : null);
  }, []);

  // Save profile changes
  const handleSaveProfile = useCallback(async () => {
    if (!editableProfile) return;

    try {
      setSaving(true);
      const updatedProfile = await updateProfile(editableProfile);
      setProfileData(updatedProfile);
      setIsEditMode(false);
      setNotification({
        message: 'Profile updated successfully!',
        type: 'success'
      });

      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setNotification({
        message: 'Failed to update profile. Please try again.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  }, [editableProfile]);

  return {
    profileData,
    editableProfile,
    isEditMode,
    loading,
    error,
    notification,
    selectedFile,
    uploading,
    saving,
    filePreview,
    fileInputRef,
    handleFileSelect,
    handleSubmit,
    handleEditClick,
    handleCancelEdit,
    handleEditChange,
    handleSaveProfile,
    setNotification
  };
};
