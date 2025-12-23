// translations.js - Simple i18n solution

export const translations = {
  en: {
    // Header
    appTitle: "Best of Ilhéus",
    
    // Bottom Navigation
    showHide: "Show/Hide",
    
    // Category Names
    restaurants: "Restaurants",
    hotels: "Hotels",
    beaches: "Beaches",
    sights: "Sights",
    
    // Info Window
    openInGoogleMaps: "Open in Google Maps →",
    
    // Loading
    loadingMap: "Loading map of Ilhéus...",
    
    // Admin Panel
    adminTitle: "Administration Panel",
    syncGoogleSheet: "Sync Google Sheet",
    backToMap: "Back to Map",
    instructions: "Instructions:",
    instructionsList: [
      "Create a Google Sheet with columns: <strong>Name</strong>, <strong>Name_EN</strong>, <strong>Name_ES</strong>, <strong>Description</strong>, <strong>Description_EN</strong>, <strong>Description_ES</strong>, <strong>Category</strong>",
      "Valid categories: <code>restaurants</code>, <code>hotels</code>, <code>beaches</code>, <code>sights</code>",
      "Optional columns: <strong>Name_EN</strong>, <strong>Name_ES</strong>, <strong>Description_EN</strong>, <strong>Description_ES</strong> (leave blank to use default language)",
      "Share the sheet publicly (Anyone with link → Viewer)",
      "Paste the full sheet URL below"
    ],
    sheetUrlPlaceholder: "https://docs.google.com/spreadsheets/d/...",
    syncButton: "Sync",
    syncing: "Syncing...",
    
    // Messages
    errorLoading: "Error loading map data",
    syncSuccess: "Successfully synced",
    syncError: "Error syncing",
    markersVisible: "markers visible",
    markersAdded: "markers added",
    geocodingErrors: "Geocoding errors:",
  },
  
  es: {
    // Header
    appTitle: "Lo Mejor de Ilhéus",
    
    // Bottom Navigation
    showHide: "Mostrar/Ocultar",
    
    // Category Names
    restaurants: "Restaurantes",
    hotels: "Hoteles",
    beaches: "Playas",
    sights: "Atracciones Turísticas",
    
    // Info Window
    openInGoogleMaps: "Abrir en Google Maps →",
    
    // Loading
    loadingMap: "Cargando mapa de Ilhéus...",
    
    // Admin Panel
    adminTitle: "Panel de Administración",
    syncGoogleSheet: "Sincronizar Google Sheet",
    backToMap: "Volver al Mapa",
    instructions: "Instrucciones:",
    instructionsList: [
      "Cree una Hoja de Google con columnas: <strong>Name</strong>, <strong>Name_EN</strong>, <strong>Name_ES</strong>, <strong>Description</strong>, <strong>Description_EN</strong>, <strong>Description_ES</strong>, <strong>Category</strong>",
      "Categorías válidas: <code>restaurants</code>, <code>hotels</code>, <code>beaches</code>, <code>sights</code>",
      "Columnas opcionales: <strong>Name_EN</strong>, <strong>Name_ES</strong>, <strong>Description_EN</strong>, <strong>Description_ES</strong> (deje en blanco para usar el idioma predeterminado)",
      "Comparta la hoja públicamente (Cualquiera con el enlace → Lector)",
      "Pegue la URL completa de la hoja a continuación"
    ],
    sheetUrlPlaceholder: "https://docs.google.com/spreadsheets/d/...",
    syncButton: "Sincronizar",
    syncing: "Sincronizando...",
    
    // Messages
    errorLoading: "Error al cargar datos del mapa",
    syncSuccess: "Sincronizado correctamente",
    syncError: "Error al sincronizar",
    markersVisible: "marcadores visibles",
    markersAdded: "marcadores agregados",
    geocodingErrors: "Errores de geocodificación:",
  },
  
  pt: {
    // Header
    appTitle: "O Melhor de Ilhéus",
    
    // Bottom Navigation
    showHide: "Mostrar/Ocultar",
    
    // Category Names
    restaurants: "Restaurantes",
    hotels: "Hotéis",
    beaches: "Praias",
    sights: "Pontos",
    
    // Info Window
    openInGoogleMaps: "Abrir no Google Maps →",
    
    // Loading
    loadingMap: "Carregando mapa de Ilhéus...",
    
    // Admin Panel
    adminTitle: "Painel de Administração",
    syncGoogleSheet: "Sincronizar Google Sheets",
    backToMap: "Voltar ao Mapa",
    instructions: "Instruções:",
    instructionsList: [
      "Crie um Google Sheet com as colunas: <strong>Name</strong>, <strong>Name_EN</strong>, <strong>Name_ES</strong>, <strong>Description</strong>, <strong>Description_EN</strong>, <strong>Description_ES</strong>, <strong>Category</strong>",
      "Categorias válidas: <code>restaurants</code>, <code>hotels</code>, <code>beaches</code>, <code>sights</code>",
      "Colunas opcionais: <strong>Name_EN</strong>, <strong>Name_ES</strong>, <strong>Description_EN</strong>, <strong>Description_ES</strong> (deixe em branco para usar o idioma padrão)",
      "Compartilhe o sheet publicamente (Qualquer pessoa com o link → Leitor)",
      "Cole a URL completa do sheet abaixo"
    ],
    sheetUrlPlaceholder: "https://docs.google.com/spreadsheets/d/...",
    syncButton: "Sincronizar",
    syncing: "Sincronizando...",
    
    // Messages
    errorLoading: "Erro ao carregar dados do mapa",
    syncSuccess: "Sincronizado com sucesso",
    syncError: "Erro ao sincronizar",
    markersVisible: "marcadores visíveis",
    markersAdded: "marcadores adicionados",
    geocodingErrors: "Erros de geocodificação:",
  }
};

// Get browser language
export const getBrowserLanguage = () => {
  const browserLang = navigator.language || navigator.userLanguage;
  const langCode = browserLang.split('-')[0]; // Get 'en' from 'en-US'
  
  // Return supported language or default to Portuguese
  if (['en', 'es', 'pt'].includes(langCode)) {
    return langCode;
  }
  return 'pt'; // Default to Portuguese
};

// Translation hook
export const useTranslation = (language) => {
  const t = (key) => {
    return translations[language]?.[key] || translations['pt']?.[key] || key;
  };
  
  return { t };
};
