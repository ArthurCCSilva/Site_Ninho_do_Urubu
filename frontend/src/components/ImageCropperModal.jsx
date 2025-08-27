// src/components/ImageCropperModal.jsx
import { useState, useCallback, useRef, useEffect } from 'react';
import { Modal } from 'bootstrap'; // Usa o JS do Bootstrap
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';

function ImageCropperModal({ show, onHide, imageSrc, onCropComplete }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const modalRef = useRef();

  // ✅ Lógica para controlar o modal do Bootstrap "puro"
  useEffect(() => {
    const modalElement = modalRef.current;
    if (!modalElement) return;
    const bsModal = Modal.getOrCreateInstance(modalElement);
    if (show) bsModal.show();
    else bsModal.hide();
  }, [show]);

  const onCropChange = useCallback((location) => { setCrop(location); }, []);
  const onZoomChange = useCallback((zoomLevel) => { setZoom(zoomLevel); }, []);
  const onCropCompleteInternal = useCallback((croppedArea, croppedAreaPixelsValue) => {
    setCroppedAreaPixels(croppedAreaPixelsValue);
  }, []);

  const handleSaveCrop = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const croppedImageFile = new File([croppedImageBlob], "cropped_image.jpeg", { type: "image/jpeg" });
      onCropComplete(croppedImageFile);
      onHide();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    // ✅ Estrutura de div do Bootstrap "puro"
    <div className="modal fade" ref={modalRef} tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Ajuste a Imagem</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body" style={{ height: '50vh', position: 'relative' }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1 / 1}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropCompleteInternal}
            />
          </div>
          <div className="modal-footer d-flex justify-content-between">
            <div className="w-50">
              <label htmlFor="zoom-range" className="form-label">Zoom</label>
              <input
                id="zoom-range"
                type="range"
                className="form-range"
                min={1} max={3} step={0.1}
                value={zoom}
                onChange={(e) => setZoom(e.target.value)}
              />
            </div>
            <div>
              <button type="button" className="btn btn-secondary me-2" onClick={onHide}>Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={handleSaveCrop}>Salvar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ImageCropperModal;