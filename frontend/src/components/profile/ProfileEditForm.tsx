import React, { RefObject } from 'react';
import styled from 'styled-components';
import { UserProfile } from '../../services/api';
import { MdEdit } from 'react-icons/md';
import { BsCamera } from 'react-icons/bs';

const ProfileCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const ProfileHeader = styled.div`
  background: linear-gradient(90deg, #1DB954, #169c46);
  padding: 30px;
  color: white;
  position: relative;
`;

const ProfileHeaderContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 20px;
`;

const ProfileImageContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;

const ProfilePicture = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
`;

const ProfileImage = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
`;

const ProfileImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: pointer;
  
  &:hover {
    opacity: 1;
  }
`;

const UploadIcon = styled.div`
  color: white;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FileInput = styled.input`
  display: none;
`;

const UploadButton = styled.button`
  background-color: white;
  color: #1DB954;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.9);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ProfileDetails = styled.div`
  flex: 1;
`;

const ProfileName = styled.h2`
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 5px;
  color: white;
`;

const ProfileRole = styled.p`
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
`;

const EditButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }
`;

const ProfileBody = styled.div`
  padding: 30px;
`;

const ProfileSection = styled.div`
  margin-bottom: 25px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ProfileLabel = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
`;

const ProfileValue = styled.div`
  font-size: 16px;
  color: #333;
  padding: 10px 0;
`;

const ProfileInput = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  color: #333;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: #1DB954;
    outline: none;
    box-shadow: 0 0 0 3px rgba(29, 185, 84, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const SaveButton = styled.button`
  flex: 1;
  background-color: #1DB954;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #169c46;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  flex: 1;
  background-color: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 6px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

interface ProfileEditFormProps {
  profileData: UserProfile;
  editableProfile: Partial<UserProfile> | null;
  isEditMode: boolean;
  uploading: boolean;
  saving: boolean;
  selectedFile: File | null;
  filePreview: string | null;
  fileInputRef: RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileSubmit: () => void;
  onEditClick: () => void;
  onCancelEdit: () => void;
  onEditChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveProfile: () => void;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  profileData,
  editableProfile,
  isEditMode,
  uploading,
  saving,
  selectedFile,
  filePreview,
  fileInputRef,
  onFileChange,
  onFileSubmit,
  onEditClick,
  onCancelEdit,
  onEditChange,
  onSaveProfile
}) => {
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <ProfileCard>
      <ProfileHeader>
        <ProfileHeaderContent>
          <ProfileImageContainer>
            <ProfilePicture>
              <ProfileImage
                src={filePreview || profileData.profile_picture || "https://via.placeholder.com/100x100?text=Profile"}
                alt={profileData.name}
              />
              <ProfileImageOverlay onClick={handleUploadClick}>
                <UploadIcon>{BsCamera({ size: 24 })}</UploadIcon>
              </ProfileImageOverlay>
              <FileInput
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFileChange}
                disabled={uploading}
                name="profile_picture"
              />
            </ProfilePicture>
            {selectedFile && (
              <UploadButton
                onClick={onFileSubmit}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Picture'}
              </UploadButton>
            )}
          </ProfileImageContainer>
          <ProfileDetails>
            <ProfileName>{profileData.name}</ProfileName>
            <ProfileRole>{profileData.role}</ProfileRole>
          </ProfileDetails>
        </ProfileHeaderContent>
        {!isEditMode && (
          <EditButton onClick={onEditClick}>
            {MdEdit({ size: 16 })} Edit Profile
          </EditButton>
        )}
      </ProfileHeader>

      <ProfileBody>
        {!isEditMode ? (
          <>
            <ProfileSection>
              <ProfileLabel>Name</ProfileLabel>
              <ProfileValue>{profileData.name}</ProfileValue>
            </ProfileSection>
            <ProfileSection>
              <ProfileLabel>Email</ProfileLabel>
              <ProfileValue>{profileData.email}</ProfileValue>
            </ProfileSection>
            <ProfileSection>
              <ProfileLabel>Role</ProfileLabel>
              <ProfileValue>{profileData.role}</ProfileValue>
            </ProfileSection>
          </>
        ) : (
          <>
            <ProfileSection>
              <ProfileLabel>Name</ProfileLabel>
              <ProfileInput
                type="text"
                name="name"
                value={editableProfile?.name || ''}
                onChange={onEditChange}
              />
            </ProfileSection>
            <ProfileSection>
              <ProfileLabel>Email</ProfileLabel>
              <ProfileInput
                type="email"
                name="email"
                value={editableProfile?.email || ''}
                onChange={onEditChange}
              />
            </ProfileSection>
            <ProfileSection>
              <ProfileLabel>Role</ProfileLabel>
              <ProfileInput
                type="text"
                name="role"
                value={editableProfile?.role || ''}
                onChange={onEditChange}
              />
            </ProfileSection>
            <ButtonGroup>
              <CancelButton onClick={onCancelEdit}>
                Cancel
              </CancelButton>
              <SaveButton onClick={onSaveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </SaveButton>
            </ButtonGroup>
          </>
        )}
      </ProfileBody>
    </ProfileCard>
  );
};
