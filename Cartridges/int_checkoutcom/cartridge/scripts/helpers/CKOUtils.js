'use strict';

/**
 * Utility functions for the Checkout.com cartridge integration.
 */
var CKOUtils = {
    /**
     * Returns a price formatted for processing by the gateway.
     */
    getFormattedPrice: function(price) {
        var orderTotalFormatted = price * 100;
        return orderTotalFormatted.toFixed();
    },

    /**
     * Returns a date formatted for processing by the gateway.
     */
    getFormattedDate: function(secs) {
        var d = new Date(secs * 1000);
        return d.toISOString();
    },

    /**
     * Returns a customer object for processing by the gateway.
     */
    getCustomer: function(order) {
        return {
            email: order.customerEmail,
            name: order.customerName
        };
    },

    /**
     * Returns a source object for processing by the gateway.
     */
    getSource: function(cardData, order) {
        return {
            type: "card",
            number: cardData.number,
            expiry_month: cardData.expiryMonth,
            expiry_year: cardData.expiryYear,
            name: cardData.name,
            cvv: cardData.cvv,
            stored: false,
            billing_address: this.getBilling(order)
        };
    },

    /**
     * Returns a capture state for processing by the gateway.
     */
    getCapture: function(val) {
        return Number(val) == 1 ? true : false;
    },

    /**
     * Returns a capture state for processing by the gateway.
     */
    getShipping: function(order) {
    	var shippingAddress = order.getDefaultShipment().getShippingAddress();
        var shippingDetails = {
            address: {
                address_line1: shippingAddress.getAddress1(),
                address_line2: (shippingAddress.getAddress2()) ? shippingAddress.getAddress2() : '',
                city: shippingAddress.getCity(),
                state: shippingAddress.getStateCode(),
                zip: shippingAddress.getPostalCode(),
                country: shippingAddress.getCountryCode().value
            }
        }

        return shippingDetails;
    },

    /**
     * Returns a capture state for processing by the gateway.
     */
    getBilling: function(order) {
    	var billingAddress = order.getBillingAddress();
        var billingDetails = {
            address_line1: billingAddress.getAddress1(),
            address_line2: (billingAddress.getAddress2()) ? billingAddress.getAddress2() : '',
            city: billingAddress.getCity(),
            state: billingAddress.getStateCode(),
            zip: billingAddress.getPostalCode(),
            country: billingAddress.getCountryCode().value
        };

        return billingDetails;
    },

    /**
     * Returns a 3ds object for processing by the gateway.
     */
    get3ds: function(threeDs, nThreeDs) {
        return {
            enabled: threeDs,
            attempt_n3d: nThreeDs
        };
    }
};

/*
 * Module exports
 */

module.exports = CKOUtils;