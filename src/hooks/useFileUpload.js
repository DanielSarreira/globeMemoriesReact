/**
 * Hook para validação e manejo de uploads de ficheiros
 * @module useFileUpload
 */

import { useState, useCallback } from 'react';
import DOMPurify from 'dompurify';

/**
 * Tipos de ficheiros permitidos
 */
const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  videos: ['video/mp4', 'video/webm', 'video/ogg']
};

/**
 * Limite de tamanho em bytes (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Limite de tamanho de nome de ficheiro
 */
const MAX_FILENAME_LENGTH = 255;

/**
 * Validação de ficheiro de imagem
 * @param {File} file - Ficheiro a validar
 * @returns {Object} { valid: boolean, error?: string }
 */
const validateImageFile = (file) => {
  // Verificar tipo
  if (!ALLOWED_FILE_TYPES.images.includes(file.type)) {
    return {
      valid: false,
      error: 'Formato de imagem não permitido. Use JPG, PNG, WebP ou GIF.'
    };
  }

  // Verificar tamanho
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'Ficheiro muito grande. Máximo 5MB.'
    };
  }

  // Verificar nome do ficheiro
  if (file.name.length > MAX_FILENAME_LENGTH) {
    return {
      valid: false,
      error: 'Nome do ficheiro muito comprido.'
    };
  }

  return { valid: true };
};

/**
 * Validação de ficheiro de vídeo
 * @param {File} file - Ficheiro a validar
 * @returns {Object} { valid: boolean, error?: string }
 */
const validateVideoFile = (file) => {
  // Verificar tipo
  if (!ALLOWED_FILE_TYPES.videos.includes(file.type)) {
    return {
      valid: false,
      error: 'Formato de vídeo não permitido. Use MP4, WebM ou OGG.'
    };
  }

  // Verificar tamanho (20MB para vídeos)
  const MAX_VIDEO_SIZE = 20 * 1024 * 1024;
  if (file.size > MAX_VIDEO_SIZE) {
    return {
      valid: false,
      error: 'Vídeo muito grande. Máximo 20MB.'
    };
  }

  // Verificar nome do ficheiro
  if (file.name.length > MAX_FILENAME_LENGTH) {
    return {
      valid: false,
      error: 'Nome do ficheiro muito comprido.'
    };
  }

  return { valid: true };
};

/**
 * Converte ficheiro para Data URL (para pré-visualização)
 * @param {File} file - Ficheiro a converter
 * @returns {Promise<string>} Data URL do ficheiro
 */
const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Hook para gerenciar upload de ficheiros
 * @returns {Object} Métodos e estado para upload
 */
export const useFileUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Valida e processa imagem
   * @param {File} file - Ficheiro de imagem
   * @returns {Promise<{valid: boolean, dataUrl?: string, error?: string}>}
   */
  const processImage = useCallback(async (file) => {
    setUploadError(null);
    
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error);
      return { valid: false, error: validation.error };
    }

    try {
      setIsUploading(true);
      const dataUrl = await fileToDataUrl(file);
      setIsUploading(false);
      return { valid: true, dataUrl };
    } catch (error) {
      const errorMsg = 'Erro ao processar imagem.';
      setUploadError(errorMsg);
      setIsUploading(false);
      return { valid: false, error: errorMsg };
    }
  }, []);

  /**
   * Valida e processa vídeo
   * @param {File} file - Ficheiro de vídeo
   * @returns {Promise<{valid: boolean, dataUrl?: string, error?: string}>}
   */
  const processVideo = useCallback(async (file) => {
    setUploadError(null);
    
    const validation = validateVideoFile(file);
    if (!validation.valid) {
      setUploadError(validation.error);
      return { valid: false, error: validation.error };
    }

    try {
      setIsUploading(true);
      const dataUrl = await fileToDataUrl(file);
      setIsUploading(false);
      return { valid: true, dataUrl };
    } catch (error) {
      const errorMsg = 'Erro ao processar vídeo.';
      setUploadError(errorMsg);
      setIsUploading(false);
      return { valid: false, error: errorMsg };
    }
  }, []);

  /**
   * Valida múltiplos ficheiros
   * @param {FileList} files - Lista de ficheiros
   * @param {string} type - Tipo de validação ('images' ou 'videos')
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  const validateMultipleFiles = useCallback((files, type = 'images') => {
    const errors = [];
    const validator = type === 'videos' ? validateVideoFile : validateImageFile;

    for (let i = 0; i < files.length; i++) {
      const validation = validator(files[i]);
      if (!validation.valid) {
        errors.push(`${files[i].name}: ${validation.error}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }, []);

  /**
   * Sanitiza nome de ficheiro
   * @param {string} filename - Nome do ficheiro original
   * @returns {string} Nome sanitizado
   */
  const sanitizeFilename = useCallback((filename) => {
    // Remove caracteres perigosos
    return DOMPurify.sanitize(filename, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    }).replace(/[^a-zA-Z0-9.-]/g, '_');
  }, []);

  /**
   * Reseta estado
   */
  const resetUploadState = useCallback(() => {
    setUploadProgress(0);
    setUploadError(null);
    setIsUploading(false);
  }, []);

  return {
    processImage,
    processVideo,
    validateMultipleFiles,
    sanitizeFilename,
    resetUploadState,
    uploadProgress,
    uploadError,
    isUploading,
    setUploadProgress,
    setUploadError
  };
};

export default useFileUpload;
