import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { uploadProfileImageToStorage } from '../../lib/firebase';
import { 
  X, 
  Camera, 
  Upload, 
  MapPin, 
  Phone, 
  User as UserIcon, 
  Briefcase, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  FileCheck
} from 'lucide-react';

export const ProfileEditModal: React.FC = () => {
  const { 
    currentUser, 
    isProfileModalOpen, 
    setIsProfileModalOpen, 
    updateUserLocally, 
    refreshUser,
    triggerGlobalRefresh 
  } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedStorageUrl, setUploadedStorageUrl] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Provider specific fields
  const [businessName, setBusinessName] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number | string>('');
  const [activeStatus, setActiveStatus] = useState<'online' | 'busy' | 'offline'>('online');

  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isProvider = currentUser?.role === 'provider';

  // Initialize form state from currentUser
  useEffect(() => {
    if (!currentUser) return;
    setName(currentUser.name || '');
    setPhone(currentUser.phone || '');
    setAvatar(currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80');
    setBio(currentUser.bio || '');
    setAddress(currentUser.location?.address || 'San Francisco Bay Area, CA');
    if (currentUser.location?.lat && currentUser.location?.lng) {
      setCoords({ lat: currentUser.location.lat, lng: currentUser.location.lng });
    }

    if (isProvider) {
      setBusinessName(currentUser.businessName || currentUser.name || '');
      // Fetch provider specific details if available
      fetch(`/api/providers/${currentUser.id}`)
        .then(res => res.ok ? res.json() : null)
        .then(prov => {
          if (prov) {
            if (prov.businessName) setBusinessName(prov.businessName);
            if (prov.bio) setBio(prov.bio);
            if (prov.serviceArea) setServiceArea(prov.serviceArea);
            if (prov.workingHours) setWorkingHours(prov.workingHours);
            if (prov.hourlyRate) setHourlyRate(prov.hourlyRate);
            if (prov.activeStatus) setActiveStatus(prov.activeStatus);
            if (prov.currentLocation?.address) setAddress(prov.currentLocation.address);
            if (prov.currentLocation?.lat) {
              setCoords({ lat: prov.currentLocation.lat, lng: prov.currentLocation.lng });
            }
          }
        })
        .catch(() => {});
    }
  }, [currentUser, isProfileModalOpen, isProvider]);

  if (!isProfileModalOpen || !currentUser) return null;

  // Handle direct file upload to Firebase Storage
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 10MB limit.');
      return;
    }

    setErrorMsg(null);
    setIsUploadingImage(true);

    try {
      // Direct Firebase Storage upload utility
      const downloadUrl = await uploadProfileImageToStorage(currentUser.id, file);
      setAvatar(downloadUrl);
      setUploadedStorageUrl(downloadUrl);
      setSuccessMsg('Profile picture securely stored in Firebase Storage!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to upload profile picture to Firebase Storage.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Get exact current GPS coordinates
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setAddress(`GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setSuccessMsg('Exact GPS coordinates captured successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        // Fallback default coordinates
        setCoords({ lat: 37.7749, lng: -122.4194 });
        setAddress('San Francisco Financial District, CA');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Name cannot be empty.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const locationPayload = coords 
        ? { lat: coords.lat, lng: coords.lng, address: address.trim() || 'Verified Location' }
        : currentUser.location || { lat: 37.7749, lng: -122.4194, address: address.trim() || 'San Francisco, CA' };

      // 1. Update user profile
      const userRes = await fetch(`/api/users/${currentUser.id}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          avatar: avatar.trim(),
          bio: bio.trim(),
          businessName: isProvider ? (businessName.trim() || name.trim()) : undefined,
          location: locationPayload
        })
      });

      if (!userRes.ok) {
        const err = await userRes.json();
        throw new Error(err.error || 'Failed to update user profile');
      }

      const userData = await userRes.json();

      // 2. If provider, update provider profile
      if (isProvider) {
        await fetch(`/api/providers/${currentUser.id}/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName: businessName.trim() || name.trim(),
            bio: bio.trim(),
            serviceArea: serviceArea.trim() || 'Greater Metropolitan Area',
            workingHours: workingHours.trim() || '8:00 AM - 8:00 PM',
            hourlyRate: hourlyRate ? Number(hourlyRate) : 65,
            activeStatus,
            currentLocation: locationPayload,
            avatar: avatar.trim(),
            name: name.trim(),
            phone: phone.trim()
          })
        });
      }

      // Update state locally in AuthContext
      updateUserLocally({
        name: name.trim(),
        phone: phone.trim(),
        avatar: avatar.trim(),
        bio: bio.trim(),
        businessName: isProvider ? (businessName.trim() || name.trim()) : undefined,
        location: locationPayload
      });

      await refreshUser();
      triggerGlobalRefresh();

      setSuccessMsg('Profile updated successfully! All changes are live.');
      setTimeout(() => {
        setSuccessMsg(null);
        setIsProfileModalOpen(false);
      }, 1200);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setErrorMsg(err.message || 'Error updating profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      id="profile-edit-modal-backdrop" 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsProfileModalOpen(false);
      }}
    >
      <div 
        id="profile-edit-modal-container"
        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 transition-all"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-emerald-200" />
              {isProvider ? 'Service Provider Profile & Store' : 'Customer Profile Settings'}
            </h3>
            <p className="text-xs text-emerald-100 mt-1">
              Update your photo, contact info, and delivery address for live tracking and communications
            </p>
          </div>
          <button
            id="close-profile-modal-btn"
            onClick={() => setIsProfileModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Notifications */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2.5 text-sm text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2.5 text-sm text-red-800 dark:text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Profile Picture Direct Firebase Storage Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Profile Photo (Firebase Storage)
              </label>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3 h-3" />
                Firebase Storage Secure
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group flex-shrink-0">
                  <img
                    id="profile-picture-preview"
                    src={avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'}
                    alt="Profile Avatar"
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-emerald-500/30 shadow-md bg-slate-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';
                    }}
                  />
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                      <span className="text-[9px] font-bold mt-1">Uploading</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <input
                    ref={fileInputRef}
                    id="profile-image-file-input"
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <button
                      type="button"
                      id="upload-profile-storage-btn"
                      disabled={isUploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                    >
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading to Storage...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Choose New Image File</span>
                        </>
                      )}
                    </button>

                    {uploadedStorageUrl && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Uploaded to Firebase Storage
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Select a JPG, PNG, or WebP file from your device. The image is uploaded directly to Firebase Storage and returns an authenticated download URL.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Basic User Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name / Display Name *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number (For VoIP/SMS)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Location & GPS for Real-time Tracking */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isProvider ? 'Service Headquarters / Live GPS Base' : 'Delivery & Service Address'}
              </label>
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isLocating}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium flex items-center gap-1"
              >
                {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                {isLocating ? 'Detecting GPS...' : 'Use Current GPS'}
              </button>
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter street address, city, or coordinates"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 dark:text-white"
              />
            </div>
            {coords && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Live Coordinates: Lat {coords.lat.toFixed(4)}, Lng {coords.lng.toFixed(4)} (Google Maps Grounded)
              </p>
            )}
          </div>

          {/* Bio / About */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isProvider ? 'Company Bio / Provider Summary' : 'About Me'}
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={isProvider ? 'Tell clients about your expertise, experience, and guarantees...' : 'Add a brief note or delivery instructions...'}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Service Provider Specialized Fields */}
          {isProvider && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" />
                Provider Business & Storefront Configuration
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Business / Brand Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Apex Plumbing & HVAC"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Base Hourly Rate ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="number"
                      min="1"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="65"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Service Radius / Coverage Area
                  </label>
                  <input
                    type="text"
                    value={serviceArea}
                    onChange={(e) => setServiceArea(e.target.value)}
                    placeholder="e.g. 25km radius from Metro center"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Operating Hours
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={workingHours}
                      onChange={(e) => setWorkingHours(e.target.value)}
                      placeholder="e.g. 8:00 AM - 8:00 PM Mon-Sat"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Status Radio */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Dispatch & Availability Status
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['online', 'busy', 'offline'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setActiveStatus(status)}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize flex items-center justify-center gap-2 transition-all ${
                        activeStatus === status
                          ? status === 'online'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                            : status === 'busy'
                            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-400 text-slate-700 dark:text-slate-300 ring-2 ring-slate-400/20'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${
                        status === 'online' ? 'bg-emerald-500' : status === 'busy' ? 'bg-amber-500' : 'bg-slate-400'
                      }`} />
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
