'use strict';

/**
 * Set the navigation state.
 * @param {string} path The navigation path
 */
function setNavigationstate(path) { // eslint-disable-line
    // Get the path members
    var members = path.split('/');

    // Set the cookie with controller name
    document.cookie = 'ckoTabs=' + members[members.length - 1];
}
