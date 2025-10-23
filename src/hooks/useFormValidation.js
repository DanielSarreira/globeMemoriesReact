/**
 * Hook para validação de formulários
 * Suporta validação em tempo real e batch
 * @module useFormValidation
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * Validadores built-in
 */
const VALIDATORS = {
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Email inválido';
  },

  password: (value) => {
    if (value.length < 8) return 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(value)) return 'Precisa de letra maiúscula';
    if (!/[a-z]/.test(value)) return 'Precisa de letra minúscula';
    if (!/[0-9]/.test(value)) return 'Precisa de número';
    return null;
  },

  phone: (value) => {
    const phoneRegex = /^(\+?\d{1,3}[-.\s]?)?\d{6,14}$/;
    return phoneRegex.test(value) ? null : 'Telefone inválido';
  },

  url: (value) => {
    try {
      new URL(value);
      return null;
    } catch {
      return 'URL inválida';
    }
  },

  username: (value) => {
    if (value.length < 3) return 'Mínimo 3 caracteres';
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Apenas letras, números, - e _';
    return null;
  },

  required: (value) => {
    const isEmpty = value === null || value === undefined || value === '';
    return isEmpty ? 'Campo obrigatório' : null;
  },

  minLength: (min) => (value) => {
    return value.length < min ? `Mínimo ${min} caracteres` : null;
  },

  maxLength: (max) => (value) => {
    return value.length > max ? `Máximo ${max} caracteres` : null;
  },

  minValue: (min) => (value) => {
    return Number(value) < min ? `Mínimo ${min}` : null;
  },

  maxValue: (max) => (value) => {
    return Number(value) > max ? `Máximo ${max}` : null;
  },

  match: (otherValue) => (value) => {
    return value !== otherValue ? 'Valores não coincidem' : null;
  },

  creditCard: (value) => {
    // Luhn algorithm
    const sanitized = value.replace(/\D/g, '');
    if (sanitized.length !== 16) return 'Cartão inválido';
    
    let sum = 0;
    for (let i = 0; i < sanitized.length; i++) {
      let digit = parseInt(sanitized[i]);
      if (i % 2 === 0) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    return sum % 10 === 0 ? null : 'Cartão inválido';
  }
};

/**
 * Hook para validação de formulários
 * @param {Object} initialValues - Valores iniciais do formulário
 * @param {Object} validationRules - Regras de validação { fieldName: [validators] }
 * @param {Function} onSubmit - Callback ao submeter formulário válido
 * @returns {Object} { values, errors, touched, validate, setFieldValue, reset, isValid, isDirty, submit }
 */
export const useFormValidation = (initialValues, validationRules, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Valida um campo específico
   */
  const validateField = useCallback((fieldName, fieldValue) => {
    const rules = validationRules[fieldName];
    if (!rules) return null;

    // rules pode ser array de validadores ou função única
    const validators = Array.isArray(rules) ? rules : [rules];

    for (const validator of validators) {
      const result = typeof validator === 'function' 
        ? validator(fieldValue)
        : VALIDATORS[validator]?.(fieldValue);
      
      if (result) return result; // Retorna primeiro erro
    }

    return null;
  }, [validationRules]);

  /**
   * Valida todos os campos
   */
  const validate = useCallback((valuesToValidate = values) => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((fieldName) => {
      const error = validateField(fieldName, valuesToValidate[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules, validateField]);

  /**
   * Atualiza valor de um campo
   */
  const setFieldValue = useCallback((fieldName, value) => {
    setValues(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Valida enquanto o usuário digita (se tocou no campo)
    if (touched[fieldName]) {
      const error = validateField(fieldName, value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error || null
      }));
    }
  }, [touched, validateField]);

  /**
   * Marca campo como tocado
   */
  const setFieldTouched = useCallback((fieldName) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));

    // Valida o campo
    const error = validateField(fieldName, values[fieldName]);
    setErrors(prev => ({
      ...prev,
      [fieldName]: error || null
    }));
  }, [values, validateField]);

  /**
   * Reset do formulário
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  /**
   * Submit do formulário
   */
  const submit = useCallback(async (e) => {
    if (e) e.preventDefault();

    // Marca todos os campos como tocados
    const allTouched = {};
    Object.keys(validationRules).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Valida
    if (validate(values)) {
      setIsSubmitting(true);
      try {
        await onSubmit?.(values);
      } catch (err) {
        console.error('Form submission error:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, validate, validationRules, onSubmit]);

  /**
   * Verifica se formulário é válido
   */
  const isValid = useMemo(() => {
    return Object.keys(validationRules).every(
      fieldName => !validateField(fieldName, values[fieldName])
    );
  }, [values, validationRules, validateField]);

  /**
   * Verifica se algum campo foi modificado
   */
  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  /**
   * Bind para usar em input (spread para onChange, onBlur)
   */
  const getFieldProps = useCallback((fieldName) => ({
    value: values[fieldName] || '',
    onChange: (e) => setFieldValue(fieldName, e.target.value),
    onBlur: () => setFieldTouched(fieldName),
    error: errors[fieldName],
    helperText: errors[fieldName],
    touched: touched[fieldName]
  }), [values, errors, touched, setFieldValue, setFieldTouched]);

  return {
    values,
    errors,
    touched,
    validate,
    validateField,
    setFieldValue,
    setFieldTouched,
    getFieldProps,
    reset,
    submit,
    isValid,
    isDirty,
    isSubmitting
  };
};

/**
 * Hook para validação de campo único
 * Útil para campos isolados (password confirm, etc)
 * @param {*} initialValue - Valor inicial
 * @param {Function} validator - Função de validação
 * @returns {Object} { value, error, setValue, setTouched, validate }
 */
export const useFieldValidation = (initialValue = '', validator) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);

  const validate = useCallback((val = value) => {
    if (validator) {
      const result = validator(val);
      setError(result);
      return !result;
    }
    return true;
  }, [validator, value]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    validate();
  }, [validate]);

  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Valida enquanto digita se já tocou
    if (touched) {
      validate(newValue);
    }
  }, [touched, validate]);

  return {
    value,
    error: touched ? error : null,
    setValue,
    setTouched: () => setTouched(true),
    validate,
    handleChange,
    handleBlur,
    bind: {
      value,
      onChange: handleChange,
      onBlur: handleBlur
    }
  };
};

/**
 * Hook para array de campos (múltiplos endereços, telefones, etc)
 */
export const useFieldArray = (initialFields = []) => {
  const [fields, setFields] = useState(initialFields);

  const append = useCallback((field) => {
    setFields(prev => [...prev, field]);
  }, []);

  const insert = useCallback((index, field) => {
    setFields(prev => {
      const newFields = [...prev];
      newFields.splice(index, 0, field);
      return newFields;
    });
  }, []);

  const remove = useCallback((index) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  }, []);

  const update = useCallback((index, field) => {
    setFields(prev => {
      const newFields = [...prev];
      newFields[index] = field;
      return newFields;
    });
  }, []);

  const reset = useCallback(() => {
    setFields(initialFields);
  }, [initialFields]);

  const clear = useCallback(() => {
    setFields([]);
  }, []);

  return {
    fields,
    append,
    insert,
    remove,
    update,
    reset,
    clear,
    length: fields.length
  };
};

/**
 * Exporta validadores para uso direto
 */
export { VALIDATORS };

export default {
  useFormValidation,
  useFieldValidation,
  useFieldArray,
  VALIDATORS
};
