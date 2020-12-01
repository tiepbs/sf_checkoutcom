document.addEventListener('DOMContentLoaded', function() {
    if (!window.ApplePaySession) {
        jQuery('#is-DW_APPLE_PAY').parent().parent().hide();
    } 
});