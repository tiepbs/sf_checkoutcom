document.addEventListener('DOMContentLoaded', function() {
    if (!window.ApplePaySession) {
        jQuery('.apple-paytab-wrapper').hide();
    } 
});