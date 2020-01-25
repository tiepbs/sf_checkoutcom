
(() => {
    subscribe('sfcc:ready', async({ value, config, isDisabled, isRequired, dataLocale, displayLocale }) => {
      
        console.log('sfcc:ready', dataLocale, displayLocale, value, config);
 
    });

})();