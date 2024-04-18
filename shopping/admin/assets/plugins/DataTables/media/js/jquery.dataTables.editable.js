/*
* File:        jquery.dataTables.editable.js
* Version:     2.3.3.
* Author:      Jovan Popovic 
* 
* Copyright 2010-2012 Jovan Popovic, all rights reserved.
*
* This source file is free software, under either the GPL v2 license or a
* BSD style license, as supplied with this software.
* 
* This source file is distributed in the hope that it will be useful, but 
* WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY 
* or FITNESS FOR A PARTICULAR PURPOSE. 
* 
* Parameters:
* @sUpdateURL                       String      URL of the server-side page used for updating cell. Default value is "UpdateData".
* @sAddURL                          String      URL of the server-side page used for adding new row. Default value is "AddData".
* @sDeleteURL                       String      URL of the server-side page used to delete row by id. Default value is "DeleteData".
* @fnShowError                      Function    function(message, action){...}  used to show error message. Action value can be "update", "add" or "delete".
* @sAddNewRowFormId                 String      Id of the form for adding new row. Default id is "formAddNewRow".
* @oAddNewRowFormOptions            Object        Options that will be set to the "Add new row" dialog
* @sAddNewRowButtonId               String      Id of the button for adding new row. Default id is "btnAddNewRow".
* @oAddNewRowButtonOptions            Object        Options that will be set to the "Add new" button
* @sAddNewRowOkButtonId             String      Id of the OK button placed in add new row dialog. Default value is "btnAddNewRowOk".
* @oAddNewRowOkButtonOptions        Object        Options that will be set to the Ok button in the "Add new row" form
* @sAddNewRowCancelButtonId         String      Id of the Cancel button placed in add new row dialog. Default value is "btnAddNewRowCancel".
* @oAddNewRowCancelButtonOptions    Object        Options that will be set to the Cancel button in the "Add new row" form
* @sDeleteRowButtonId               String      Id of the button for adding new row. Default id is "btnDeleteRow".
* @oDeleteRowButtonOptions            Object        Options that will be set to the Delete button
* @sSelectedRowClass                String      Class that will be associated to the selected row. Default class is "row_selected".
* @sReadOnlyCellClass               String      Class of the cells that should not be editable. Default value is "read_only".
* @sAddDeleteToolbarSelector        String      Selector used to identify place where add and delete buttons should be placed. Default value is ".add_delete_toolbar".
* @fnStartProcessingMode            Function    function(){...} called when AJAX call is started. Use this function to add "Please wait..." message  when some button is pressed.
* @fnEndProcessingMode              Function    function(){...} called when AJAX call is ended. Use this function to close "Please wait..." message.
* @aoColumns                        Array       Array of the JEditable settings that will be applied on the columns
* @sAddHttpMethod                   String      Method used for the Add AJAX request (default is 'POST')
* @sAddDataType                     String      Data type expected from the server when adding a row; allowed values are the same as those accepted by JQuery's "datatype" parameter, e.g. 'text' and 'json'. The default is 'text'.
* @sDeleteHttpMethod                String      Method used for the Delete AJAX request (default is 'POST')
* @sDeleteDataType                  String      Data type expected from the server when deleting a row; allowed values are the same as those accepted by JQuery's "datatype" parameter, e.g. 'text' and 'json'. The default is 'text'.
* @fnOnDeleting                     Function    function(tr, id, fnDeleteRow){...} Function called before row is deleted.
tr isJQuery object encapsulating row that will be deleted
id is an id of the record that will be deleted.
fnDeleteRow(id) callback function that should be called to delete row with id
returns true if plugin should continue with deleting row, false will abort delete.
* @fnOnDeleted                      Function    function(status){...} Function called after delete action. Status can be "success" or "failure"
* @fnOnAdding                       Function    function(){...} Function called before row is added.
returns true if plugin should continue with adding row, false will abort add.
* @fnOnNewRowPosted                    Function    function(data) Function that can override default function that is called when server-side sAddURL returns result
You can use this function to add different behaviour when server-side page returns result
* @fnOnAdded                        Function    function(status){...} Function called after add action. Status can be "success" or "failure"
* @fnOnEditing                      Function    function(input){...} Function called before cell is updated.
input JQuery object wrapping the input element used for editing value in the cell.
returns true if plugin should continue with sending AJAX request, false will abort update.
* @fnOnEdited                       Function    function(status){...} Function called after edit action. Status can be "success" or "failure"
* @sEditorHeight                    String      Default height of the cell editors
* @sEditorWidth                     String      Default width of the cell editors
* @oDeleteParameters                Object      Additonal objects added to the DELETE Ajax request
* @oUpdateParameters                Object      Additonal objects added to the UPDATE Ajax request
* @sIDToken                         String      Token in the add new row dialog that will be replaced with a returned id of the record that is created eg DT_RowId
* @sSuccessResponse                 String        Text returned from the server if record is successfully deleted or edited. Default "ok" 
* @sFailureResponsePrefix            String        Prefix of the error message returned form the server during edit action
*/
(function ($) {

    $.fn.makeEditable = function (options) {

        var iDisplayStart = 0;

        function fnGetCellID(cell) {
            ///<summary>
            ///Utility function used to determine id of the cell
            ///By default it is assumed that id is placed as an id attribute of <tr> that that surround the cell (<td> tag). E.g.:
            ///<tr id="17">
            ///  <td>...</td><td>...</td><td>...</td><td>...</td>
            ///</tr>
            ///</summary>
            ///<param name="cell" type="DOM" domElement="true">TD cell refference</param>

            return properties.fnGetRowID($(cell.parentNode));
        }

        function _fnSetRowIDInAttribute(row, id, overwrite) {
            ///<summary>
            ///Utility function used to set id of the row. Usually when a new record is created, added to the table,
            ///and when id of the record is retrieved from the server-side.
            ///It is assumed that id is placed as an id attribute of <tr> that that surround the cell (<td> tag). E.g.:
            ///<tr id="17">
            ///  <td>...</td><td>...</td><td>...</td><td>...</td>
            ///</tr>
            ///This function is used when a datatable is configured in the server side processing mode or ajax source mode
            ///</summary>
            ///<param name="row" type="DOM" domElement="true">TR row where record is placed</param>

            if (overwrite) {
                row.attr("id", id);
            } else {
                if (row.attr("id") == null || row.attr("id") == "")
                    row.attr("id", id);
            }
        }

        function _fnGetRowIDFromAttribute(row) {
            ///<summary>
            ///Utility function used to get id of the row.
            ///It is assumed that id is placed as an id attribute of <tr> that that surround the cell (<td> tag). E.g.:
            ///<tr id="17">
            ///  <td>...</td><td>...</td><td>...</td><td>...</td>
            ///</tr>
            ///This function is used when a datatable is configured in the standard client side mode
            ///</summary>
            ///<param name="row" type="DOM" domElement="true">TR row where record is placed</param>
            ///<returns type="Number">Id of the row - by default id attribute placed in the TR tag</returns>

            return row.attr("id");
        }

        function _fnSetRowIDInFirstCell(row, id) {
            ///<summary>
            ///Utility function used to set id of the row. Usually when a new record is created, added to the table,
            ///and when id of the record is retrieved from the server-side).
            ///It is assumed that id is placed as a value of the first &lt;TD&gt; cell in the &lt;TR&gt;. As example:
            ///<tr>
            ///     <td>17</td><td>...</td><td>...</td><td>...</td>
            ///</tr>
            ///This function is used when a datatable is configured in the server side processing mode or ajax source mode
            ///</summary>
            ///<param name="row" type="DOM" domElement="true">TR row where record is placed</param>

            $("td:first", row).html(id);
        }


        function _fnGetRowIDFromFirstCell(row) {
            ///<summary>
            ///Utility function used to get id of the row.
            ///It is assumed that id is placed as a value of the first &lt;TD&gt; cell in the &lt;TR&gt;. As example:
            ///<tr>
            ///     <td>17</td><td>...</td><td>...</td><td>...</td>
            ///</tr>
            ///This function is used when a datatable is configured in the server side processing mode or ajax source mode
            ///</summary>
            ///<param name="row" type="DOM" domElement="true">TR row where record is placed</param>
            ///<returns type="Number">Id of the row - by default id attribute placed in the TR tag</returns>

            return $("td:first", row).html();

        }

        //Reference to the DataTable object
        var oTable;
        //Refences to the buttons used for manipulating table data
        var oAddNewRowButton, oDeleteRowButton, oConfirmRowAddingButton, oCancelRowAddingButton;
        //Reference to the form used for adding new data
        var oAddNewRowForm;

        //Plugin options
        var properties;

        function _fnShowError(errorText, action) {
            ///<summary>
            ///Shows an error message (Default function)
            ///</summary>
            ///<param name="errorText" type="String">text that should be shown</param>
            ///<param name="action" type="String"> action that was executed when error occured e.g. "update", "delete", or "add"</param>

            alert(errorText);
        }

        function _fnStartProcessingMode() {
            ///<summary>
            ///Function that starts "Processing" mode i.e. shows "Processing..." dialog while some action is executing(Default function)
            ///</summary>

            if (oTable.fnSettings().oFeatures.bProcessing) {
                $(".dataTables_processing").css('visibility', 'visible');
            }
        }

        function _fnEndProcessingMode() {
            ///<summary>
            ///Function that ends the "Processing" mode and returns the table in the normal state(Default function)
            ///It shows processing message only if bProcessing setting is set to true
            ///</summary>

            if (oTable.fnSettings().oFeatures.bProcessing) {
                $(".dataTables_processing").css('visibility', 'hidden');
            }
        }

        var sOldValue, sNewCellValue, sNewCellDislayValue;

        function fnApplyEditable(aoNodes) {
            ///<summary>
            ///Function that applies editable plugin to the array of table rows
            ///</summary>
            ///<param name="aoNodes" type="Array[TR]">Aray of table rows &lt;TR&gt; that should be initialized with editable plugin</param>

            if (properties.bDisableEditing)
                return;
            var oDefaultEditableSettings = {
                event: 'dblclick',

                "onsubmit": function (settings, original) {
                    sOldValue = original.revert;
                    sNewCellValue = null;
                    sNewCellDisplayValue = null;
                    iDisplayStart = fnGetDisplayStart();

                    if(settings.type == "text" || settings.type == "select" || settings.type == "textarea" )
                    {
                        var input = $("input,select,textarea", this);
                        sNewCellValue = $("input,select,textarea", $(this)).val();
                        if (input.length == 1) {
                            var oEditElement = input[0];
                            if (oEditElement.nodeName.toLowerCase() == "select" || oEditElement.tagName.toLowerCase() == "select")
                                sNewCellDisplayValue = $("option:selected", oEditElement).text(); //For select list use selected text instead of value for displaying in table
                            else
                                sNewCellDisplayValue = sNewCellValue;
                        }

                        if (!properties.fnOnEditing(input, settings, original.revert, fnGetCellID(original)))
                            return false;
                        var x = settings;
                        
                        //2.2.2 INLINE VALIDATION
                        if (settings.oValidationOptions != null) {
                            input.parents("form").validate(settings.oValidationOptions);
                        }
                        if (settings.cssclass != null) {
                            input.addClass(settings.cssclass);
                        }
                        if(settings.cssclass == null && settings.oValidationOptions == null){
                            return true;
                        }else{
                            if (!input.valid() || 0 == input.valid())
                                return false;
                            else
                                return true;
                        }
                        
                    }
                    
                    properties.fnStartProcessingMode();
                },
                "submitdata": function (value, settings) {
                    //iDisplayStart = fnGetDisplayStart();
                    //properties.fnStartProcessingMode();
                    var id = fnGetCellID(this);
                    var rowId = oTable.fnGetPosition(this)[0];
                    var columnPosition = oTable.fnGetPosition(this)[1];
                    var columnId = oTable.fnGetPosition(this)[2];
                    var sColumnName = oTable.fnSettings().aoColumns[columnId].sName;
                    if (sColumnName == null || sColumnName == "")
                        sColumnName = oTable.fnSettings().aoColumns[columnId].sTitle;
                    var updateData = null;
                    if (properties.aoColumns == null || properties.aoColumns[columnId] == null) {
                        updateData = $.extend({},
                                            properties.oUpdateParameters,
                                            {
                                                "id": id,
                                                "rowId": rowId,
                                                "columnPosition": columnPosition,
                                                "columnId": columnId,
                                                "columnName": sColumnName
                                            });
                    }
                    else {
                        updateData = $.extend({},
                                            properties.oUpdateParameters,
                                            properties.aoColumns[columnId].oUpdateParameters,
                                            {
                                                "id": id,
                                                "rowId": rowId,
                                                "columnPosition": columnPosition,
                                                "columnId": columnId,
                                                "columnName": sColumnName
                                            });
                    }
                    return updateData;
                },
                "callback": function (sValue, settings) {
                    properties.fnEndProcessingMode();
                    var status = "";
                    var aPos = oTable.fnGetPosition(this);
                    
                    var bRefreshTable = !oSettings.oFeatures.bServerSide;
                    $("td.last-updated-cell", oTable.fnGetNodes( )).removeClass("last-updated-cell");
                    if(sValue.indexOf(properties.sFailureResponsePrefix)>-1)
                    {
                        oTable.fnUpdate(sOldValue, aPos[0], aPos[2], bRefreshTable);
                        $("td.last-updated-cell", oTable).removeClass("last-updated-cell");
                        $(this).addClass("last-updated-cell");
                        properties.fnShowError(sValue.replace(properties.sFailureResponsePrefix, "").trim(), "update");
                        status = "failure";
                    } else {
                    
                        if (properties.sSuccessResponse == "IGNORE" || 
                            (     properties.aoColumns != null
                                && properties.aoColumns[aPos[2]] != null 
                                && properties.aoColumns[aPos[2]].sSuccessResponse == "IGNORE") || 
                            (sNewCellValue == null) || (sNewCellValue == sValue) || 
                            properties.sSuccessResponse == sValue) {
                            if(sNewCellDisplayValue == null)
                            {
                                //sNewCellDisplayValue = sValue;
                                oTable.fnUpdate(sValue, aPos[0], aPos[2], bRefreshTable);
                            }else{
                                oTable.fnUpdate(sNewCellDisplayValue, aPos[0], aPos[2], bRefreshTable);
                            }
                            $("td.last-updated-cell", oTable).removeClass("last-updated-cell");
                            $(this).addClass("last-updated-cell");
                            status = "success";
                        } else {
                            oTable.fnUpdate(sOldValue, aPos[0], aPos[2], bRefreshTable);
                            properties.fnShowError(sValue, "update");
                            status = "failure";
                        }
                    }

                    properties.fnOnEdited(status, sOldValue, sNewCellDisplayValue, aPos[0], aPos[1], aPos[2]);
                    if (settings.fnOnCellUpdated != null) {
                        settings.fnOnCellUpdated(status, sValue, aPos[0], aPos[2], settings);
                    }
                    
                    fnSetDisplayStart();
                    if (properties.bUseKeyTable) {
                                var keys = oTable.keys;
                                /* Unblock KeyTable, but only after this 'esc' key event has finished. Otherwise
                                * it will 'esc' KeyTable as well
                                */
                                setTimeout(function () { keys.block = false; }, 0);
                            }
                },
                "onerror": function () {
                    properties.fnEndProcessingMode();
                    properties.fnShowError("Cell cannot be updated", "update");
                    properties.fnOnEdited("failure");
                },
                
                "onreset": function(){ 
                        if (properties.bUseKeyTable) {
                                var keys = oTable.keys;
                                /* Unblock KeyTable, but only after this 'esc' key event has finished. Otherwise
                                * it will 'esc' KeyTable as well
                                */
                                setTimeout(function () { keys.block = false; }, 0);
                            }

                },
                "height": properties.sEditorHeight,
                "width": properties.sEditorWidth
            };

            var cells = null;

            if (properties.aoColumns != null) {

                for (var iDTindex = 0, iDTEindex = 0; iDTindex < oSettings.aoColumns.length; iDTindex++) {
                    if (oSettings.aoColumns[iDTindex].bVisible) {//if DataTables column is visible
                        if (properties.aoColumns[iDTEindex] == null) {
                            //If editor for the column is not defined go to the next column
                            iDTEindex++;
                            continue;
                        }
                        //Get all cells in the iDTEindex column (nth child is 1-indexed array)
                        cells = $("td:nth-child(" + (iDTEindex + 1) + ")", aoNodes);

                        var oColumnSettings = oDefaultEditableSettings;
                        oColumnSettings = $.extend({}, oDefaultEditableSettings, properties.oEditableSettings, properties.aoColumns[iDTEindex]);
                        iDTEindex++;
                        var sUpdateURL = properties.sUpdateURL;
                        try {
                            if (oColumnSettings.sUpdateURL != null)
                                sUpdateURL = oColumnSettings.sUpdateURL;
                        } catch (ex) {
                        }
                        //cells.editable(sUpdateURL, oColumnSettings);
                        cells.each(function () {
                            if (!$(this).hasClass(properties.sReadOnlyCellClass)) {
                                $(this).editable(sUpdateURL, oColumnSettings);
                            }
                        });
                    }

                } //end for
            } else {
                cells = $('td:not(.' + properties.sReadOnlyCellClass + ')', aoNodes);
                cells.editable(properties.sUpdateURL, $.extend({}, oDefaultEditableSettings, properties.oEditableSettings));
            }
        }

        function fnOnRowAdding(event) {
            ///<summary>
            ///Event handler called when a user click on the submit button in the "Add new row" form. 
            ///</summary>
            ///<param name="event">Event that caused the action</param>

            if (properties.fnOnAdding()) {
                if (oAddNewRowForm.valid()) {
                    iDisplayStart = fnGetDisplayStart();
                    properties.fnStartProcessingMode();

                    if (properties.bUseFormsPlugin) {
                        //Still in beta(development)
                        $(oAddNewRowForm).ajaxSubmit({
                            dataType: 'xml',
                            success: function (response, statusString, xhr) {
                                if (xhr.responseText.toLowerCase().indexOf("error") != -1) {
                                    properties.fnEndProcessingMode();
                                    properties.fnShowError(xhr.responseText.replace("Error",""), "add");
                                    properties.fnOnAdded("failure");
                                } else {
                                    fnOnRowAdded(xhr.responseText);
                                }

                            },
                            error: function (response) {
                                properties.fnEndProcessingMode();
                                properties.fnShowError(response.responseText, "add");
                                properties.fnOnAdded("failure");
                            }
                        }
                        );

                    } else {

                        var params = oAddNewRowForm.serialize();
                        $.ajax({ 'url': properties.sAddURL,
                            'data': params,
                            'type': properties.sAddHttpMethod,
                            'dataType': properties.sAddDataType,
                            success: fnOnRowAdded,
                            error: function (response) {
                                properties.fnEndProcessingMode();
                                properties.fnShowError(response.responseText, "add");
                                properties.fnOnAdded("failure");
                            }
                        });
                    }
                }
            }
            event.stopPropagation();
            event.preventDefault();
        }

        function _fnOnNewRowPosted(data) {
            ///<summary>Callback function called BEFORE a new record is posted to the server</summary>
            ///TODO: Check this

            return true;
        }

        
        function fnOnRowAdded(data) {
            ///<summary>
            ///Function that is called when a new row is added, and Ajax response is returned from server
            /// This function takes data from the add form and adds them into the table.
            ///</summary>
            ///<param name="data" type="int">Id of the new row that is returned from the server</param>

            properties.fnEndProcessingMode();

            if (properties.fnOnNewRowPosted(data)) {

                var oSettings = oTable.fnSettings();
                if (!oSettings.oFeatures.bServerSide) {
                    jQuery.data(oAddNewRowForm, 'DT_RowId', data);
                    var values = fnTakeRowDataFromFormElements(oAddNewRowForm);
                   

                    var rtn;
                    //Add values from the form into the table
                    if (oSettings.aoColumns != null && isNaN(parseInt(oSettings.aoColumns[0].mDataProp))) {
                        rtn = oTable.fnAddData(rowData);
                    }
                    else {
                        rtn = oTable.fnAddData(values);
                    }

                    var oTRAdded = oTable.fnGetNodes(rtn);
                    //add id returned by server page as an TR id attribute
                    properties.fnSetRowID($(oTRAdded), data, true);
                    //Apply editable plugin on the cells of the table
                    fnApplyEditable(oTRAdded);

                    $("tr.last-added-row", oTable).removeClass("last-added-row");
                    $(oTRAdded).addClass("last-added-row");
                } /*else {
                    oTable.fnDraw(false);
                }*/
                //Close the dialog
                oAddNewRowForm.dialog('close');
                $(oAddNewRowForm)[0].reset();
                $(".error", $(oAddNewRowForm)).html("");

                fnSetDisplayStart();
                properties.fnOnAdded("success");
                                    if (properties.bUseKeyTable) {
                                var keys = oTable.keys;
                                /* Unblock KeyTable, but only after this 'esc' key event has finished. Otherwise
                                * it will 'esc' KeyTable as well
                                */
                                setTimeout(function () { keys.block = false; }, 0);
                            }
            }
        }

        function fnOnCancelRowAdding(event) {
            ///<summary>
            ///Event handler function that is executed when a user press cancel button in the add new row form
            ///This function clean the add form and error messages if some of them are shown
            ///</summary>
            ///<param name="event" type="int">DOM event that caused an error</param>

            //Clear the validation messages and reset form
            $(oAddNewRowForm).validate().resetForm();  // Clears the validation errors
            $(oAddNewRowForm)[0].reset();

            $(".error", $(oAddNewRowForm)).html("");
            $(".error", $(oAddNewRowForm)).hide();  // Hides the error element

            //Close the dialog
            oAddNewRowForm.dialog('close');
            event.stopPropagation();
            event.preventDefault();
        }


        function fnDisableDeleteButton() {
            ///<summary>
            ///Function that disables delete button
            ///</summary>

           if (properties.bUseKeyTable) {
                return;
            }
            if (properties.oDeleteRowButtonOptions != null) {
                //oDeleteRowButton.disable();
                oDeleteRowButton.button("option", "disabled", true);
            } else {
                oDeleteRowButton.attr("disabled", "true");
            }
        }

        function fnEnableDeleteButton() {
            ///<summary>
            ///Function that enables delete button
            ///</summary>

            if (properties.oDeleteRowButtonOptions != null) {
                //oDeleteRowButton.enable();
                oDeleteRowButton.button("option", "disabled", false);
            } else {
                oDeleteRowButton.removeAttr("disabled");
            }
        }

        var nSelectedRow, nSelectedCell;
        var oKeyTablePosition;


        function _fnOnRowDeleteInline(e) {

            var sURL = $(this).attr("href");
            if (sURL == null || sURL == "")
                sURL = properties.sDeleteURL;

            e.preventDefault();
            e.stopPropagation();

            iDisplayStart = fnGetDisplayStart();

            nSelectedCell = ($(this).parents('td'))[0];
            jSelectedRow = ($(this).parents('tr'));
            nSelectedRow = jSelectedRow[0];

            jSelectedRow.addClass(properties.sSelectedRowClass);

            var id = fnGetCellID(nSelectedCell);
            if (properties.fnOnDeleting(jSelectedRow, id, fnDeleteRow)) {
                fnDeleteRow(id, sURL);
            }
        }


        function _fnOnRowDelete(event) {
            ///<summary>
            ///Event handler for the delete button
            ///</summary>
            ///<param name="event" type="Event">DOM event</param>

            event.preventDefault();
            event.stopPropagation();

            iDisplayStart = fnGetDisplayStart();
            
            nSelectedRow = null;
            nSelectedCell = null;
            
            if (!properties.bUseKeyTable) {
                if ($('tr.' + properties.sSelectedRowClass + ' td', oTable).length == 0) {
                    //oDeleteRowButton.attr("disabled", "true");
                    _fnDisableDeleteButton();
                    return;
                }
                nSelectedCell = $('tr.' + properties.sSelectedRowClass + ' td', oTable)[0];
            } else {
                nSelectedCell = $('td.focus', oTable)[0];

            }
            if (nSelectedCell == null) {
                fnDisableDeleteButton();
                return;
            }
            if (properties.bUseKeyTable) {
                oKeyTablePosition = oTable.keys.fnGetCurrentPosition();
            }
            var id = fnGetCellID(nSelectedCell);
            var jSelectedRow = $(nSelectedCell).parent("tr");
            nSelectedRow = jSelectedRow[0];
            if (properties.fnOnDeleting(jSelectedRow, id, fnDeleteRow)) {
                fnDeleteRow(id);
            }
        }

        function _fnOnDeleting(tr, id, fnDeleteRow) {
            ///<summary>
            ///The default function that is called before row is deleted
            ///Returning false will abort delete
            ///Function can be overriden via plugin properties in order to create custom delete functionality
            ///in that case call fnDeleteRow with parameter id, and return false to prevent double delete action
            ///</summary>
            ///<param name="tr" type="JQuery">JQuery wrapper around the TR tag that will be deleted</param>
            ///<param name="id" type="String">Id of the record that wil be deleted</param>
            ///<param name="fnDeleteRow" type="Function(id)">Function that will be called to delete a row. Default - fnDeleteRow(id)</param>

            return confirm("Are you sure that you want to delete this record?"); ;
        }
        
        
        function fnDeleteRow(id, sDeleteURL) {
            ///<summary>
            ///Function that deletes a row with an id, using the sDeleteURL server page
      