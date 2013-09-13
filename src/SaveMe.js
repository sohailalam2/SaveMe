// TODO: 2. Optionally save the SaveMe instance as key value pair - key being a unique name
// TODO: 3. Make SaveMe work in Worker environment as well
// TODO: 4. Make SaveMe work with AMD such as require.js
// TODO: 5. Licensing
// TODO: 6. README.md and NOTICE.txt
// TODO: 7. Examples
// TODO: 8. GitHub site

/**
 * This is a helper script using which you can save data to browser's
 * local storage, session storage in a efficient and easy way.
 *
 * Example:
 *
 * <pre>
 *
 var saveMe = new SaveMe('local')
 .registerSuccessHandler('success', function(type, msg){
            console.log("TYPE: " + type + ", MSG: " + msg);
        })
 .registerErrorHandler('error', function(type, msg){
            console.error("TYPE: " + type + ", MSG: " + msg);
        })
 .save('1', 'one')
 .save('2', 'two')
 .save('three', '3')
 .remove('1')
 .remove('SaveMe-2');
 *
 * </pre>
 *
 * User: Sohail Alam
 * Version: 1.0.0
 * Date: 11/9/13
 * Time: 8:21 PM
 */
var SaveMe = function () {
    'use strict';
    var me = this;
    if (!(me && me.hasOwnProperty && (me instanceof SaveMe))) {
        me = new SaveMe();
    }
    return me._init.apply(me, arguments);
};

(function () {
    var local = "local",
        session = "session",
        canSave = false,
        canSaveToLocal = false,
        canSaveToSession = false,
        doesNotSupport = "Your Browser is TOO OLD... I Can Not Save Your Data",
        unsupportedType = "Unsupported Storage Type. Select either SaveMe.local or SaveMe.session",
        saveMe = null,
        type = undefined,
        namespace = "SaveMe-",
        errorHandlers = {},
        successHandlers = {};

    // *** Static *** //
    SaveMe.LOCAL = local;
    SaveMe.SESSION = session;

    // ERROR TYPES
    SaveMe._ERROR_INITIALIZATION_ = "_ERROR_INITIALIZATION_";
    SaveMe._ERROR_UNSUPPORTED_ = "_ERROR_UNSUPPORTED_";
    SaveMe._ERROR_ALREADY_EXISTS_ = "_ERROR_ALREADY_EXISTS_";
    SaveMe._ERROR_WRONG_TYPE_ = "_ERROR_WRONG_TYPE_";
    SaveMe._ERROR_SAVE_ = "_ERROR_SAVE_";
    SaveMe._ERROR_KEY_ = "_ERROR_KEY_";
    SaveMe._ERROR_GET_ = "_ERROR_GET_";
    SaveMe._ERROR_REMOVE_ = "_ERROR_REMOVE_";

    // SUCCESS TYPES
    SaveMe._SUCCESS_HANDLER_ADDED_ = "_SUCCESS_HANDLER_ADDED_";
    SaveMe._SUCCESS_HANDLER_REMOVED_ = "_SUCCESS_HANDLER_REMOVED_";
    SaveMe._SUCCESS_SAVE_ = "_SUCCESS_SAVE_";
    SaveMe._SUCCESS_REMOVE_ = "_SUCCESS_REMOVE_";

    //------------------------- String Helper Methods -------------------------//

    /**
     * A method to on to operate Strings and check if it starts with the given prefix
     *
     * @param prefix The starting characters
     * @returns {boolean} true/false
     */
    String.prototype.startsWith = function (prefix) {
        return this.indexOf(prefix, 0) !== -1;
    };

    /**
     * A method to on to operate Strings and check if it ends with the given suffix
     *
     * @param suffix The ending characters
     * @returns {boolean} true/false
     */
    String.prototype.endsWith = function (suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };

    //---------------------- End of String Helper Methods ----------------------//


    //------------------------- Internal Logger API -------------------------//
    var logger = new function () {
        // true - To enable the internal logger
        var enabled = true;
        this.info = function (message) {
            if (enabled)
                console.log("Internal Logger: <SaveMe> INFO: " + message);
        };
        this.debug = function (message) {
            if (enabled)
                console.debug("Internal Logger: <SaveMe> DEBUG: " + message);
        };
        this.error = function (message, e) {
            if (enabled) {
                console.error("Internal Logger: <SaveMe> ERROR: " + message);
                if (e)
                    console.error(e);
            }
        };
        this.fatal = function (message, e) {
            console.error("Internal Logger: <SaveMe> FATAL: " + message);
            if (e)
                console.error(e);
        }
    };
    //------------------------- End of Internal Logger API -------------------------//

    //-------------------------------- Local methods -------------------------------//

    /**
     * Check what kind of saving abilities does the browser supports, if at all.
     */
    function checkAbility() {
        try {
            // Check whether Storage is defined or not
            if (typeof(Storage) !== "undefined") {
                canSave = true;
                // Check whether localStorage and sessionStorage is defined or not
                if (typeof(localStorage) !== "undefined" && typeof(sessionStorage) !== "undefined") {
                    canSaveToLocal = true;
                    canSaveToSession = true;
                } else {
                    // Check whether localStorage is defined or not
                    if (typeof(localStorage) !== "undefined") {
                        canSaveToLocal = true;
                        canSaveToSession = false;
                    }
                    // Check whether sessionStorage is defined or not
                    else if (typeof(sessionStorage) !== "undefined") {
                        canSaveToLocal = false;
                        canSaveToSession = true;
                    }
                }
            }
        } catch (e) {
            canSave = false;
            canSaveToLocal = false;
            canSaveToSession = false;
        }
    }

    /**
     * Select the Storage Type based on the given String
     *
     * @param storageType String representing the type of Storage
     *
     * @returns {*}
     */
    function selectStorage(storageType) {
        // If storageType is defined
        if (storageType) {
            // If storageType is an instance of Storage - meaning Storage is supported
            if (storageType instanceof Storage) {
                // If storageType provided is an instance of localStorage
                if (storageType === localStorage) {
                    type = SaveMe.LOCAL;
                    return localStorage;
                }
                // If storageType provided is an instance of sessionStorage
                else if (storageType === sessionStorage) {
                    type = SaveMe.SESSION;
                    return sessionStorage;
                }
                // If storageType provided is an instance of some other storage type
                // which SaveMe is not supporting at the moment
                else {
                    logger.fatal(unsupportedType);
                    errorCallback(SaveMe._ERROR_UNSUPPORTED_, unsupportedType, null);
                }
            }
            // If the storage type is a string
            else {
                // lower case it and check its type
                if (storageType.toLowerCase() === local && canSaveToLocal) {
                    type = SaveMe.LOCAL;
                    return localStorage;
                } else if (storageType.toLowerCase() === session && canSaveToSession) {
                    type = SaveMe.SESSION;
                    return sessionStorage;
                } else {
                    logger.fatal(unsupportedType);
                    errorCallback(SaveMe._ERROR_UNSUPPORTED_, unsupportedType, null);
                    return null;
                }
            }
        }
        // If storageType is not provided as an argument then prefer localStorage and if not available
        // go for sessionStorage and if all fails then provide error callback and return null
        else {
            if (canSaveToLocal) {
                type = SaveMe.LOCAL;
                return localStorage;
            } else if (canSaveToSession) {
                type = SaveMe.SESSION;
                return sessionStorage;
            } else {
                logger.fatal(doesNotSupport);
                errorCallback(SaveMe._ERROR_UNSUPPORTED_, doesNotSupport, null);
                return null;
            }
        }
    }

    /**
     * Provide error callbacks
     *
     * @param type The type of ERROR
     * @param message The message to send
     * @param e The error (if any)
     */
    function errorCallback(type, message, e) {
        // Provide callback using all the registered handlers
        for (var key in errorHandlers) {
            if (errorHandlers.hasOwnProperty(key))
                if (e !== null || e !== undefined) {
                    errorHandlers[key](type, message, e);
                } else {
                    errorHandlers[key](type, message);
                }
        }
    }

    /**
     * Provide success callbacks
     *
     * @param type The type of SUCCESS
     * @param message The message to send
     */
    function successCallback(type, message) {
        // Provide callback using all the registered handlers
        for (var key in successHandlers) {
            if (successHandlers.hasOwnProperty(key))
                successHandlers[key](type, message);
        }
    }

    /**
     * Check whether the given key already contains the namespace or not
     *
     * @param key The key to check
     * @returns The new key with proper formatting
     */
    function checkKeyForNS(key) {
        var k;
        if (key.startsWith(namespace))
            k = key;
        else
            k = namespace + key;

        return k;
    }

    //---------------------------- End of Local methods ---------------------------//

    //--------------------------------- Prototype ---------------------------------//

    SaveMe.prototype = {

        // *** Lifecycle Methods *** //

        /**
         * Initializes a new SaveMe instance, or re-initializes an existing one.
         * The SaveMe constructor delegates to this method to do the initializing,
         * and the mutator instance methods call this to re-initialize when something changes.
         *
         * @protected
         * @method  _init
         * @param   {String | Storage}  storageType - the Storage Type String, or Storage instance
         * @param successHandler
         * @param errorHandler
         *
         * @returns SaveMe instance for method chaining
         */
        _init: function (storageType, errorHandler, successHandler) {

            this.constructor = SaveMe;

            // Check what kind of saving ability does the browser has
            checkAbility();

            // Add handlers if provided
            if (errorHandler) {
                this.registerErrorHandler("Primary", errorHandler);
            }
            if (successHandler) {
                this.registerSuccessHandler("Primary", successHandler);
            }

            // Stop if can not save
            if (!canSave) {
                logger.fatal(doesNotSupport);
                errorCallback(SaveMe._ERROR_INITIALIZATION_, doesNotSupport, null);
                return null;
            }

            // assign the storage type
            saveMe = selectStorage(storageType.trim());

            return this;
        },

        // *** Object Methods *** //

        /**
         * TODO: toString()
         * Returns the formatted URL String.
         * Overridden Object toString method to do something useful.
         *
         * @public
         * @method  toString
         *
         * @returns SaveMe instance for method chaining
         */
        toString: function () {

            return this;
        },

        /**
         * Check whether you can use SaveMe to save content or not
         *
         * @returns {boolean} true/false
         */
        canSave: function () {
            return canSave;
        },

        /**
         * Check whether you can use SaveMe to save content to local storage or not
         *
         * @returns {boolean} true/false
         */
        canSaveToLocal: function () {
            return canSaveToLocal;
        },

        /**
         * Check whether you can use SaveMe to save content to session storage or not
         *
         * @returns {boolean} true/false
         */
        canSaveToSession: function () {
            return canSaveToSession;
        },

        /**
         * Check the type for this SaveMe instance
         *
         * @returns {string} "local" or "session"
         */
        type: function () {
            return type;
        },

        /**
         * Change the current StorageTpe associated with this SaveMe instance.
         *
         * @param storageType The storage type
         *
         * @returns SaveMe instance for method chaining
         */
        changeStorageType: function (storageType) {
            type = selectStorage(storageType.trim());
            return this;
        },

        /**
         * Get the namespace for the storage
         *
         * @returns {string} The namespace
         */
        namespace: function () {
            return namespace;
        },

        /**
         * Change the default namespace for Storage
         *
         * @param ns {string} The new namespace
         *
         * @returns SaveMe instance for method chaining
         */
        changeNameSpace: function (ns) {
            namespace = ns.trim();
            return this;
        },

        // *** Accessor/Mutator Methods *** //

        // +++ Handlers

        /**
         * Register an error handler to this SaveMe instance
         *
         * @param name The unique name for this handler
         * @param handler The handler method, can have two parameters - type and message
         *
         * @returns SaveMe instance for method chaining
         */
        registerErrorHandler: function (name, handler) {
            // If an handler with the same name is already registered
            if (errorHandlers[name.trim()] !== undefined) {
                logger.error("Error Handler has already been registered by the name : " + name);
                errorCallback(SaveMe._ERROR_ALREADY_EXISTS_,
                    "Error Handler has already been registered by the name : " + name, null);
            }

            // If provided handler parameter is a function
            if (typeof(handler) == 'function') {
                errorHandlers[name.trim()] = handler;
                successCallback(SaveMe._SUCCESS_HANDLER_ADDED_,
                    "Error Handler has been added successfully : " + name);
            }
            else {
                logger.fatal("Error Handler MUST be a function : " + name);
                errorCallback(SaveMe._ERROR_WRONG_TYPE_,
                    "Error Handler MUST be a function : " + name, null);
            }
            return this;
        },

        /**
         * Register an success handler to this SaveMe instance
         *
         * @param name The unique name for this handler
         * @param handler The handler method, can have two parameters - type and message
         *
         * @returns SaveMe instance for method chaining
         */
        registerSuccessHandler: function (name, handler) {
            // If an handler with the same name is already registered
            if (successHandlers[name.trim()] !== undefined) {
                logger.error("Success Handler has already been added : " + name);
                errorCallback(SaveMe._ERROR_ALREADY_EXISTS_,
                    "Success Handler has already been added : " + name, null);
            }

            // If provided handler parameter is a function
            if (typeof(handler) == 'function') {
                successHandlers[name] = handler;
                successCallback(SaveMe._SUCCESS_HANDLER_ADDED_,
                    "Success Handler has been added successfully : " + name);
            }
            else {
                logger.fatal("Success Handler MUST be a function : " + name);
                errorCallback(SaveMe._ERROR_WRONG_TYPE_,
                    "Success Handler MUST be a function : " + name, null);
            }
            return this;
        },

        // --- Handlers

        /**
         * Deregister an error handler to this SaveMe instance
         *
         * @param name The unique name for the handler to remove
         *
         * @returns SaveMe instance for method chaining
         */
        deregisterErrorHandler: function (name) {
            if (delete errorHandlers[name.trim()]) {
                successCallback(SaveMe._SUCCESS_HANDLER_REMOVED_,
                    "Error Handler has been added removed : " + name);
            }
            return this;
        },

        /**
         * Deregister all handlers registered for error reporting
         */
        deregisterAllErrorHandlers: function () {
            for (var name in errorHandlers) {
                if (errorHandlers.hasOwnProperty(name))
                    this.deregisterErrorHandler(name);
            }
        },

        /**
         * Deregister an success handler to this SaveMe instance
         *
         * @param name The unique name for the handler to remove
         *
         * @returns SaveMe instance for method chaining
         */
        deregisterSuccessHandler: function (name) {
            if (delete successHandlers[name.trim()]) {
                successCallback(SaveMe._SUCCESS_HANDLER_REMOVED_,
                    "Success Handler has been added removed : " + name);
            }
            return this;
        },

        /**
         * Deregister all handlers registered for error reporting
         */
        deregisterAllSuccessHandler: function () {
            for (var name in successHandlers) {
                if (successHandlers.hasOwnProperty(name))
                    this.deregisterSuccessHandler(name);
            }
        },

        /**
         * Save the given key value pair into the Storage
         *
         * @param key The key with which to save the data
         * @param value The data to save
         *
         * @returns SaveMe instance for method chaining
         */
        save: function (key, value) {
            if (saveMe) {
                var k;
                try {
                    // Check whether the given key already contains the namespace or not
                    k = checkKeyForNS(key.trim());

                    saveMe.setItem(k, value);
                    successCallback(SaveMe._SUCCESS_SAVE_, "Data saved successfully corresponding to the key: " + k);
                } catch (e) {
                    logger.error(e);
                    errorCallback(SaveMe._ERROR_SAVE_, "Could Not Save Data corresponding to the key: " + k, e);
                }
            } else {
                logger.fatal(doesNotSupport);
                errorCallback(SaveMe._ERROR_UNSUPPORTED_, doesNotSupport, null);
            }
            return this;
        },

        /**
         * FIXME
         * Get the key corresponding to a given position or key
         *
         * @param key
         * @returns {string}
         */
        key: function (key) {
            if (saveMe) {
                var k;
                try {
                    // Check whether the given key already contains the namespace or not
                    k = checkKeyForNS(key.trim());

                    return saveMe.key(k);
                } catch (e) {
                    logger.error(e);
                    errorCallback(SaveMe._ERROR_KEY_, "Error getting the SaveMe key: " + k, e);
                    return null;
                }
            } else {
                logger.fatal(doesNotSupport);
                errorCallback(SaveMe._ERROR_UNSUPPORTED_, doesNotSupport, null);
                return null;
            }
        },

        /**
         * Check whether the given key exists in the Storage
         *
         * @param key The key without namespace
         *
         * @returns {boolean} true/false
         */
        contains: function (key) {
            if (saveMe) {
                return this.key(key.trim()) !== 'undefined';
            } else {
                logger.fatal(doesNotSupport);
                errorCallback(SaveMe._ERROR_UNSUPPORTED_, doesNotSupport, null);
                return false;
            }
        },

        /**
         * Get the value corresponding to the given key
         *
         * @param key
         * @returns {*}
         */
        get: function (key) {
            if (saveMe) {
                var k;
                try {
                    // Check whether the given key already contains the namespace or not
                    k = checkKeyForNS(key.trim());

                    return saveMe.getItem(k);
                } catch (e) {
                    logger.error(e);
                    errorCallback(SaveMe._ERROR_GET_, "Could Not Get Data corresponding to the key: " + k, e);
                    return null;
                }
            } else {
                logger.fatal(doesNotSupport);
                errorCallback(SaveMe._ERROR_UNSUPPORTED_, doesNotSupport, null);
                return null;
            }
        },

        /**
         * TODO
         * Get all the data that has been saved by this SaveMe instance
         *
         * @returns {*}
         */
        getAll: function () {
            if (saveMe) {
                var temp = {};
                for (var i = 0; i < saveMe.length; i++) {
                    temp[this.key(i)] = this.get(this.key(i));
                }
            } else {
                logger.fatal(doesNotSupport);
                errorCallback(SaveMe._ERROR_UNSUPPORTED_, doesNotSupport, null);
            }
        },

        /**
         * Remove the data that has been saved by the given key
         *
         * @param key The key corresponding to which the data was saved
         *
         * @returns SaveMe instance for method chaining
         */
        remove: function (key) {
            if (saveMe) {
                var k;
                try {
                    // Check whether the given key already contains the namespace or not
                    k = checkKeyForNS(key.trim());

                    saveMe.removeItem(k);
                    successCallback(SaveMe._SUCCESS_REMOVE_, "Entry removed successfully corresponding to key: " + k);
                } catch (e) {
                    logger.error(e);
                    errorCallback(SaveMe._ERROR_REMOVE_, "Could not remove from SaveMe: ", e);
                    return null;
                }
            } else {
                logger.fatal(doesNotSupport);
                errorCallback(SaveMe._ERROR_UNSUPPORTED_, doesNotSupport, null);
            }
            return this;
        },

        /**
         * Remove all the data that has been saved by this SaveMe instance
         *
         * @returns SaveMe instance for method chaining
         */
        removeAll: function () {
            if (saveMe) {
                try {
                    for (var i = 0; i < saveMe.length; i++) {
                        saveMe.removeItem(saveMe.key(i));
                    }
                    successCallback(SaveMe._SUCCESS_REMOVE_, "All Entries removed successfully");
                } catch (e) {
                    logger.error(e);
                    errorCallback(SaveMe._ERROR_REMOVE_, "Could not remove all items from SaveMe: ", e);
                }
            } else {
                logger.fatal(doesNotSupport);
                errorCallback(SaveMe._ERROR_UNSUPPORTED_, doesNotSupport, null);
            }
            return this;
        }
    }
})();
