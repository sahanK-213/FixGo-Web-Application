import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-solid-svg-icons";
import { UPLOADS_URL } from "../../../src/services/api";

function ShopGalleryTab({
  galleryImages,
  uploadingGallery,
  fileInputRef,
  handleUploadImage,
  isDeleteMode,
  setIsDeleteMode,
  selectedImagesToDelete,
  setSelectedImagesToDelete,
  handleToggleSelectImage,
  handleConfirmBatchDelete,
  deletingGallery,
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <h3 className="font-extrabold text-lg text-slate-900 m-0 flex items-center gap-2">
          <span>🖼️</span> Shop Gallery <span className="text-xs font-normal text-slate-500">({galleryImages.length}/4)</span>
          {uploadingGallery && <span className="text-xs text-green-600 font-semibold ml-1">(Uploading...)</span>}
        </h3>
        
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUploadImage}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingGallery || galleryImages.length >= 4}
            title={galleryImages.length >= 4 ? "Maximum 4 images allowed" : "Add Image"}
            className={`py-2 px-4 rounded-xl border font-semibold text-xs cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs ${
              galleryImages.length >= 4
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                : "border-green-600 bg-white text-green-600 hover:bg-green-50"
            }`}
          >
            + Add Photo
          </button>
          <button
            type="button"
            onClick={() => {
              setIsDeleteMode(!isDeleteMode);
              setSelectedImagesToDelete([]);
            }}
            title={isDeleteMode ? "Cancel Removing" : "Remove Images"}
            className={`py-2 px-4 rounded-xl font-semibold text-xs cursor-pointer flex items-center gap-1.5 transition-all ${
              isDeleteMode
                ? "bg-slate-200 text-slate-700 border border-slate-300"
                : "border border-red-500 bg-white text-red-600 hover:bg-red-50"
            }`}
          >
            {isDeleteMode ? "Cancel" : "− Remove Images"}
          </button>
        </div>
      </div>

      {galleryImages.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {galleryImages.map((img) => {
              const isSelected = selectedImagesToDelete.includes(img.id);
              return (
                <div
                  key={img.id}
                  onClick={() => isDeleteMode && handleToggleSelectImage(img.id)}
                  className={`relative h-44 rounded-2xl overflow-hidden border bg-slate-50 transition-all ${
                    isDeleteMode ? "cursor-pointer" : ""
                  } ${
                    isSelected
                      ? "ring-2 ring-red-500 border-red-500 shadow-md"
                      : "border-slate-200 hover:border-green-300"
                  }`}
                >
                  <img
                    src={`${UPLOADS_URL}/${img.url}`}
                    alt="Gallery Photo"
                    className="w-full h-full object-cover"
                  />
                  {isDeleteMode && (
                    <div className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${
                      isSelected ? "bg-red-600 text-white" : "bg-black/40 text-white/80 border border-white"
                    }`}>
                      {isSelected ? "✓" : "○"}
                    </div>
                  )}
                </div>
              );
            })}

            {galleryImages.length < 4 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-44 rounded-2xl border-2 border-dashed border-slate-300 hover:border-green-500 bg-slate-50/50 hover:bg-green-50/30 flex flex-col items-center justify-center cursor-pointer transition-all text-slate-500 hover:text-green-600"
              >
                <span className="text-2xl font-bold mb-1">+</span>
                <span className="text-xs font-semibold">Add Photo</span>
              </div>
            )}
          </div>

          {isDeleteMode && (
            <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200 flex items-center justify-between">
              <span className="text-xs text-red-700 font-medium">
                {selectedImagesToDelete.length} selected for deletion
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirmBatchDelete}
                  disabled={deletingGallery || selectedImagesToDelete.length === 0}
                  className={`py-1.5 px-4 rounded-xl text-xs font-bold text-white border-none ${
                    selectedImagesToDelete.length === 0 || deletingGallery
                      ? "bg-red-300 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700 cursor-pointer shadow-2xs"
                  }`}
                >
                  {deletingGallery ? "Deleting..." : `Confirm Remove (${selectedImagesToDelete.length})`}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteMode(false);
                    setSelectedImagesToDelete([]);
                  }}
                  className="py-1.5 px-3 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-10 sm:p-12 mb-4 flex flex-col items-center justify-center gap-3 text-center border-2 border-dashed border-slate-200 rounded-2xl w-full min-w-0">
          <FontAwesomeIcon icon={faImage} className="text-4xl sm:text-5xl text-gray-200 mb-1" />
          <p className="text-base sm:text-[17px] font-bold text-gray-900 m-0 leading-snug break-words">
            No gallery photos yet
          </p>
          <p className="text-xs sm:text-[13px] text-gray-500 m-0 max-w-md leading-relaxed whitespace-normal break-words">
            Upload photos of your workshop, equipment, and team to showcase your business to customers.
          </p>
        </div>
      )}

      <p className="text-xs font-medium text-slate-500 m-0">
        Recommended size: 1200 x 800 pixels. Max 5MB per image.
      </p>
    </div>
  );
}

export default ShopGalleryTab;
