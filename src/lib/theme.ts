export const THEME_STORAGE_KEY = "ga-theme";

/** Script inline pour éviter un flash au chargement (défaut = sombre). */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'){document.documentElement.classList.add('light');document.documentElement.style.colorScheme='light';}else{document.documentElement.classList.remove('light');document.documentElement.style.colorScheme='dark';}}catch(e){}})();`;
