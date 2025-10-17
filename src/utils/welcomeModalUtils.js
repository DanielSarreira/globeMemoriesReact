/**
 * Utilitários para gestão do Modal de Boas-Vindas
 * Este sistema permite que novos conteúdos criados no backoffice sejam sempre exibidos,
 * mesmo que o viajante tenha marcado "não mostrar novamente" numa versão anterior.
 */

// Versão atual do modal (será atualizada quando houver novo conteúdo do backoffice)
// Formato: YYYYMMDD-X (data + número da versão do dia)
export const CURRENT_MODAL_VERSION = '20251014-1';

/**
 * Verifica se o modal de boas-vindas deve ser exibido
 * @param {string} currentVersion - Versão atual do modal (do backoffice)
 * @returns {boolean} - True se o modal deve ser exibido
 */
export const shouldShowWelcomeModal = (currentVersion = CURRENT_MODAL_VERSION) => {
  try {
    // Obtém a versão que foi vista pelo viajante
    const viewedVersion = localStorage.getItem('globeMemoriesWelcomeVersion');
    
    // Se não houver versão armazenada, deve mostrar o modal
    if (!viewedVersion) {
      console.log('No previous version found. Showing modal.');
      return true;
    }
    
    // Se a versão atual é diferente da versão vista, deve mostrar o modal
    if (viewedVersion !== currentVersion) {
      console.log(`New version available. Viewed: ${viewedVersion}, Current: ${currentVersion}. Showing modal.`);
      return true;
    }
    
    // Se as versões são iguais e o viajante marcou "não mostrar", não exibe
    console.log(`Same version (${currentVersion}). Modal already viewed. Not showing.`);
    return false;
    
  } catch (error) {
    console.error('Error checking welcome modal version:', error);
    // Em caso de erro, mostra o modal por segurança
    return true;
  }
};

/**
 * Marca o modal como visualizado para a versão atual
 * @param {string} version - Versão do modal que foi visualizada
 */
export const markWelcomeModalAsViewed = (version = CURRENT_MODAL_VERSION) => {
  try {
    localStorage.setItem('globeMemoriesWelcomeVersion', version);
    console.log('Welcome modal marked as viewed. Version:', version);
  } catch (error) {
    console.error('Error marking welcome modal as viewed:', error);
  }
};

/**
 * Limpa o histórico de visualização do modal (útil para testes ou reset)
 */
export const resetWelcomeModalHistory = () => {
  try {
    localStorage.removeItem('globeMemoriesWelcomeVersion');
    // Remove também a chave antiga se existir
    localStorage.removeItem('globeMemoriesWelcomeShown');
    console.log('Welcome modal history reset.');
  } catch (error) {
    console.error('Error resetting welcome modal history:', error);
  }
};

/**
 * Obtém a versão atual que foi visualizada pelo viajante
 * @returns {string|null} - Versão visualizada ou null se nunca foi visualizado
 */
export const getViewedModalVersion = () => {
  try {
    return localStorage.getItem('globeMemoriesWelcomeVersion');
  } catch (error) {
    console.error('Error getting viewed modal version:', error);
    return null;
  }
};

/**
 * Verifica se existe uma nova versão disponível
 * @param {string} currentVersion - Versão atual do modal
 * @returns {boolean} - True se existe uma nova versão
 */
export const hasNewModalVersion = (currentVersion = CURRENT_MODAL_VERSION) => {
  const viewedVersion = getViewedModalVersion();
  return viewedVersion !== null && viewedVersion !== currentVersion;
};

/**
 * Função para o backoffice: valida o formato da versão
 * @param {string} version - Versão a validar
 * @returns {boolean} - True se o formato é válido
 */
export const isValidVersionFormat = (version) => {
  // Formato esperado: YYYYMMDD-X
  const versionRegex = /^\d{8}-\d+$/;
  return versionRegex.test(version);
};

/**
 * Função para o backoffice: compara duas versões
 * @param {string} version1 - Primeira versão
 * @param {string} version2 - Segunda versão
 * @returns {number} - Negativo se v1 < v2, 0 se igual, positivo se v1 > v2
 */
export const compareVersions = (version1, version2) => {
  if (!isValidVersionFormat(version1) || !isValidVersionFormat(version2)) {
    console.error('Invalid version format');
    return 0;
  }
  
  return version1.localeCompare(version2);
};
