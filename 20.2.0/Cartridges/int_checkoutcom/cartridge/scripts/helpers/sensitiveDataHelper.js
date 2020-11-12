'use strict';

/**
 * Utility functions.
 */
var sensitiveDataHelper = {

    /**
     * Hide sensitive data from the source_data object
     * @param {Object} sourceDataObject object from request/response
     * @returns {Object} filtered data
     */
    cleanSourceDataObject: function(sourceDataObject) {
        var sourceData = sourceDataObject;
        if (Object.prototype.hasOwnProperty.call(sourceData, 'first_name')) { sourceData.first_name = String.prototype.replace.call(sourceData.first_name, /\w/gi, '*'); }

        if (Object.prototype.hasOwnProperty.call(sourceData, 'last_name')) { sourceData.last_name = String.prototype.replace.call(sourceData.last_name, /\w/gi, '*'); }

        if (Object.prototype.hasOwnProperty.call(sourceData, 'account_iban')) { sourceData.account_iban = String.prototype.replace.call(sourceData.account_iban, /\w/gi, '*'); }

        return sourceData;
    },

    /**
     * Hide sensitive data from the souce object
     * @param {Object} sourceObject object from request/response
     * @returns {Object} filtered data
     */
    cleanSourceObject: function(sourceObject) {
        var source = sourceObject;
        if (Object.prototype.hasOwnProperty.call(source, 'fingerprint')) {
            source.fingerprint = String.prototype.replace.call(source.fingerprint, /\w/gi, '*');
        }
        if (Object.prototype.hasOwnProperty.call(source, 'authorization_token')) {
            source.authorization_token = String.prototype.replace.call(source.authorization_token, /\w/gi, '*');
        }
        if (Object.prototype.hasOwnProperty.call(source, 'id')) {
            source.id = String.prototype.replace.call(source.id, /\w/gi, '*');
        }
        if (Object.prototype.hasOwnProperty.call(source, 'phone')) {
            source.phone.number = String.prototype.replace.call(source.phone.number, /\d/gi, '*');
        }
        if (Object.prototype.hasOwnProperty.call(source, 'billing_address')) {
            source.billing_address = this.cleanBillingAddress(source.billing_address);
        }
        if (Object.prototype.hasOwnProperty.call(source, 'number')) {
            source.number = String.prototype.replace.call(source.number, /\d/gi, '*');
        }
        if (Object.prototype.hasOwnProperty.call(source, 'cvv')) {
            source.cvv = String.prototype.replace.call(source.cvv, /\d/gi, '*');
        }

        return source;
    },

    /**
     * Hide sensitive data from the billingAddress object
     * @param {Object} billingAddressObject object from request/response
     * @returns {Object} filtered data
     */
    cleanBillingAddress: function(billingAddressObject) {
        var billingAddress = billingAddressObject;
        if (Object.prototype.hasOwnProperty.call(billingAddress, 'given_name')) {
            billingAddress.given_name = String.prototype.replace.call(billingAddress.given_name, /\w/gi, '*');
        }
        if (Object.prototype.hasOwnProperty.call(billingAddress, 'family_name')) {
            billingAddress.family_name = String.prototype.replace.call(billingAddress.family_name, /\w/gi, '*');
        }
        if (Object.prototype.hasOwnProperty.call(billingAddress, 'email')) {
            billingAddress.email = String.prototype.replace.call(billingAddress.email, /\w/gi, '*');
        }
        if (Object.prototype.hasOwnProperty.call(billingAddress, 'street_address')) {
            billingAddress.street_address = String.prototype.replace.call(billingAddress.street_address, /\w/gi, '*');
        }
        if (Object.prototype.hasOwnProperty.call(billingAddress, 'street_address2')) {
            billingAddress.street_address2 = String.prototype.replace.call(billingAddress.street_address2, /\w/gi, '*');
        }
        if (Object.prototype.hasOwnProperty.call(billingAddress, 'postal_code')) {
            billingAddress.postal_code = String.prototype.replace.call(billingAddress.postal_code, /\w/gi, '*');
        }
        if (Object.prototype.hasOwnProperty.call(billingAddress, 'phone')) {
            billingAddress.phone = String.prototype.replace.call(billingAddress.phone, /\w/gi, '*');
        }
        if (Object.prototype.hasOwnProperty.call(billingAddress, 'address_line1')) {
            billingAddress.address_line1 = String.prototype.replace.call(billingAddress.address_line1, /\w/gi, '*');
        }
        if (Object.prototype.hasOwnProperty.call(billingAddress, 'address_line2')) {
            billingAddress.address_line2 = String.prototype.replace.call(billingAddress.address_line2, /\w/gi, '*');
        }
        if (Object.prototype.hasOwnProperty.call(billingAddress, 'city')) {
            billingAddress.city = String.prototype.replace.call(billingAddress.city, /\w/gi, '*');
        }
        if (Object.prototype.hasOwnProperty.call(billingAddress, 'zip')) {
            billingAddress.zip = String.prototype.replace.call(billingAddress.zip, /\w/gi, '*');
        }

        return billingAddress;
    },

    /**
     * Hide sensitive data from the customer object
     * @param {Object} customerObject object from request/response
     * @returns {Object} filtered data
     */
    cleanCustomerObject: function(customerObject) {
        var customer = customerObject;
        if (Object.prototype.hasOwnProperty.call(customer, 'id')) {
            customer.id = String.prototype.replace.call(customer.id, /\w/gi, '*');
        }
        if (Object.prototype.hasOwnProperty.call(customer, 'email')) {
            customer.email = String.prototype.replace.call(customer.email, /\w/gi, '*');
        }
        if (Object.prototype.hasOwnProperty.call(customer, 'name')) {
            customer.name = String.prototype.replace.call(customer.name, /\w/gi, '*');
        }

        return customer;
    },

    /**
     * Hide sensitive data from the shipping object
     * @param {Object} shippingObject object from request/response
     * @returns {Object} filtered data
     */
    cleanShippingObject: function(shippingObject) {
        var shipping = shippingObject;
        if (Object.prototype.hasOwnProperty.call(shipping, 'address')) {
            shipping.address.address_line1 = String.prototype.replace.call(shipping.address.address_line1, /\w/gi, '*');
            shipping.address.address_line2 = String.prototype.replace.call(shipping.address.address_line2, /\w/gi, '*');
            shipping.address.city = String.prototype.replace.call(shipping.address.city, /\w/gi, '*');
            shipping.address.zip = String.prototype.replace.call(shipping.address.zip, /\w/gi, '*');
        }
        if (Object.prototype.hasOwnProperty.call(shipping, 'phone')) {
            shipping.phone.number = String.prototype.replace.call(shipping.phone.number, /\d/gi, '*');
        }

        return shipping;
    },
};

/**
 * Module exports
 */
module.exports = sensitiveDataHelper;
