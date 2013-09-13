/**
 * This script shows how to use SaveMe API in its simplest form.
 *
 * User: Sohail Alam
 * Version: 1.0.0
 * Date: 13/9/13
 * Time: 9:36 PM
 */

// Instantiate SaveMe
var saveMe = new SaveMe('session');

var $messages = $("#messages");

// Update the DOM
function addToMessageList(key, data) {
    $messages.append("<tr style='font-size: large'><td class='text-left'>" + key
        + " </td><td class='text-left'>" + data
        + "</td><td class='text-right'>" +
        "<button class='btn btn-block btn-danger' name='delete'>Delete</button>" +
        "</td></tr>");
}

// Register click event for delete button
function registerDeleteButtonAction() {
    $("button[name='delete']").click(function (event) {
        // jQuery wrapper for clicked element
        var clicked = $(this);

        // Delete the data and remove from table
        var selected = $(clicked).parent().parent();
        saveMe.remove($(selected.children()[0]).html());
        selected.remove();
    });
}

// Register click event for save button
$('#btnSaveMe').click(function () {
    var key = $('#key').val();
    var data = $('#data').val();

    saveMe.save(key, data);
    addToMessageList(key, saveMe.get(key));
    registerDeleteButtonAction();
});