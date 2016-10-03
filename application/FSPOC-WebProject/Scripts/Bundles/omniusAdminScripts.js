$(function () {
    $("#filterSelectType").val($("#previousSearchType").val());
    $("#filterSelectLevel").val($("#previousSearchLevel").val());
    $("#filterSelectSource").val($("#previousSearchSource").val());
    $("#filterSelectUser").val($("#previousSearchUser").val());
    $("#filterSearchMessage").val($("#previousSearchMessage").val());
    $("#filterSearchTimeFrom").val($("#previousSearchTimeFrom").val());
    $("#filterSearchTimeTo").val($("#previousSearchTimeTo").val());

    $("#filterSearchTimeFrom,#filterSearchTimeTo").datetimepicker({
        datepicker: true, 
        timepicker: true, 
        step: 5, 
        format: "d-m-Y H:i"
       
    }); 

});

sourceEndpoint = {
    endpoint: "Rectangle",
    paintStyle: { fillStyle: "#54c6f0", width: 12, height: 18 },
    hoverPaintStyle: { fillStyle: "#f98e4b" },
    isSource: true,
    connector: ["Flowchart", { stub: [5, 5], gap: 4, cornerRadius: 4 }],
    connectorStyle: {
        lineWidth: 2,
        strokeStyle: "#54c6f0",
        joinstyle: "round"
    },
    connectorHoverStyle: { strokeStyle: "#f98e4b" },
    cssClass: "sourceEndpoint",
    maxConnections: -1
}
trueEndpoint = $.extend({}, sourceEndpoint, {
    overlays: [
        ["Label", {
            location: [1.7, 1.5],
            label: "True",
            cssClass: "endpointSourceLabel"
        }]
    ]
});
falseEndpoint = $.extend({}, sourceEndpoint, {
    paintStyle: { fillStyle: "#54c6f0", width: 18, height: 10 },
    overlays: [
        ["Label", {
            location: [1.5, 2],
            label: "False",
            cssClass: "endpointSourceLabel"
        }]
    ]
});
jsPlumb.ready(function () {
    if (CurrentModuleIs("tapestryModule")) {

        $(".resourceRule, .workflowRule").each(function (ruleIndex, rule) {
            currentInstance = CreateJsPlumbInstanceForRule($(rule));
        });
        $("#resourceRulesPanel .item, #workflowRulesPanel .item, #workflowRulesPanel .symbol").each(function (index, element) {
            AddToJsPlumb($(element));
        });
    }
});

var LastAssignedNumber = 0;
SystemTables = [
    {
        Name: "Omnius::AppRoles",
        Columns: ["Id", "Name", "Priority", "ApplicationId"]
    },
    {
        Name: "Omnius::Users",
        Columns: ["Id", "DisplayName", "Company", "Job", "Address", "Email"]
    },
    {
        Name: "Omnius::LogItems",
        Columns: ["Id", "Timestamp", "LogEventType", "UserId", "IsPlatformEvent", "AppId", "Message"]
    }
];

function CreateJsPlumbInstanceForRule(ruleElement) {
    newInstance = jsPlumb.getInstance({
        Endpoint: ["Blank", {}],
        HoverPaintStyle: { strokeStyle: "#ff4000", lineWidth: 2 },
        ConnectionOverlays: [
            ["Arrow", {
                location: 1,
                length: 12,
                width: 15,
                height: 12,
                foldback: 0.8,
            }]
        ]
    });
    if(!ruleElement.attr("id"))
        ruleElement.attr("id", AssingID());
    newInstance.setContainer(ruleElement);
    newInstance.bind("click", function (con) {
        this.detach(con);
        ChangedSinceLastSave = true;
    });
    ruleElement.data("jsPlumbInstance", newInstance);
    return newInstance;
}
function AddToJsPlumb(item) {
    if (!item.attr("id")) {
        itemId = AssingID();
        item.attr("id", itemId);
    }
    else {
        itemId = item.attr("id");
    }
    item.draggable({
        revert: false,
        drag: function (event, ui) {
            element = $(this);
            rule = element.parents(".rule");
            rule.data("jsPlumbInstance").repaintEverything();
            resourceRuleMode = rule.hasClass("resourceRule");

            ui.position.left = Math.round((ui.position.left + element.width()/2) / 20) * 20 - element.width()/2;
            ui.position.top = Math.round((ui.position.top + element.height()/2) / 20) * 20 - element.height()/2;

            rightEdge = ui.position.left + element.width() + (resourceRuleMode ? 20 : 122);
            bottomEdge = ui.position.top + element.height() + 20;

            limitChecked = false;

            if (rule.width() < rightEdge + 30) {
                limits = CheckRuleResizeLimits(rule, resourceRuleMode);
                limitChecked = true;
                rule.width(rightEdge + 30);
            }
            if (rule.height() < bottomEdge) {
                if (!limitChecked) {
                    limits = CheckRuleResizeLimits(rule, resourceRuleMode);
                    limitChecked = true;
                }
                rule.height(bottomEdge);
            }
            if (limitChecked) {
                if (rule.width() > limits.horizontal - 10)
                    rule.width(limits.horizontal - 10);
                if (rule.height() > limits.vertical - 10)
                    rule.height(limits.vertical - 10);
                limitChecked = false;
            }
            if (resourceRuleMode) {
                if (ui.position.left < 10)
                    ui.position.left = 10;
                else if (ui.position.left + element.width() + 40 > rule.width())
                    ui.position.left = rule.width() - element.width() - 40;
                if (ui.position.top < 10)
                    ui.position.top = 10;
                else if (ui.position.top + element.height() + 20 > rule.height())
                    ui.position.top = rule.height() - element.height() - 20;
            }
            else {
                swimlane = element.parents(".swimlane");
                if (ui.position.left < 0)
                    ui.position.left = 0;
                else if (ui.position.left + element.width() + 40 > swimlane.width())
                    ui.position.left = swimlane.width() - element.width() - 40;
                if (ui.position.top < 0 && ui.position.top > -50)
                    ui.position.top = 0;
                else if (ui.position.top <= -50) {
                    currentSwimlaneIndex = swimlane.index();
                    swimlaneCount = rule.find(".swimlane").length;
                    if (currentSwimlaneIndex > 0) {
                        higherSwimlane = rule.find(".swimlane").eq(currentSwimlaneIndex-1).find(".swimlaneContentArea");
                        element.detach();
                        higherSwimlane.append(element);
                        element.position.top = 0;
                        return false;
                    }
                    else
                        ui.position.top = 0;
                }
                else if (ui.position.top + element.height() > swimlane.height() - 20 && ui.position.top + element.height() <= swimlane.height() + 30)
                    ui.position.top = swimlane.height() - element.height() - 20;
                else if (ui.position.top + element.height() > swimlane.height() + 30) {
                    currentSwimlaneIndex = swimlane.index();
                    swimlaneCount = rule.find(".swimlane").length;
                    if (currentSwimlaneIndex < swimlaneCount - 1) {
                        lowerSwimlane = rule.find(".swimlane").eq(currentSwimlaneIndex + 1).find(".swimlaneContentArea");
                        element.detach();
                        lowerSwimlane.append(element);
                        element.position.top = lowerSwimlane.height() - element.height();
                        return false;
                    }
                    else
                        ui.position.top = swimlane.height() - element.height() - 20;
                }
            }
        },
        stop: function (event, ui) {
            instance = $(this).parents(".rule").data("jsPlumbInstance");
            instance.recalculateOffsets();
            instance.repaintEverything();
            ChangedSinceLastSave = true;
        }
    });
    item.css({
        left: Math.round((item.position().left + item.width()/2) / 20) * 20 - item.width()/2,
        top: Math.round((item.position().top + item.height()/2) / 20) * 20 - item.height()/2
    });
    instance = item.parents(".rule").data("jsPlumbInstance");
    specialEndpointsType = item.attr("endpoints");
    if (specialEndpointsType == "gateway") {
        instance.addEndpoint(itemId, trueEndpoint, {
            anchor: "RightMiddle", uuid: itemId + "RightMiddle"
        });
        instance.addEndpoint(itemId, falseEndpoint, {
            anchor: "BottomCenter", uuid: itemId + "BottomCenter"
        });
    }
    else if (specialEndpointsType == "final" || item.hasClass("targetItem")) { }
    else {
        instance.addEndpoint(itemId, sourceEndpoint, {
            anchor: "RightMiddle", uuid: itemId + "RightMiddle"
        });
    }
    instance.makeTarget(item, {
        dropOptions: { hoverClass: "dragHover" },
        anchor: "Continuous",
        allowLoopback: false
    });
}
function ToolboxItemDraggable(item) {
    item.find(".toolboxItem").draggable({
        helper: "clone",
        appendTo: '#tapestryWorkspace',
        containment: 'window',
        tolerance: "fit",
        revert: true,
        scroll: true,
        start: function () {
            dragModeActive = true;
        }
    });
}
function AssingID() {
    LastAssignedNumber++;
    return "tapestryElement" + LastAssignedNumber;
}
function AddIconToItem(element) {
    item = $(element);
    if (item.hasClass("attribute")) {
        item.prepend($('<i class="fa fa-database" style="margin-right: 6px;"></i>'));
    }
    else if (item.hasClass("port")) {
        item.prepend($('<i class="fa fa-sign-out" style="margin-left: 1px; margin-right: 5px;"></i>'));
    }
    else if (item.hasClass("role")) {
        item.prepend($('<i class="fa fa-user" style="margin-left: 1px; margin-right: 6px;"></i>'));
    }
    else if (item.hasClass("view")) {
        item.prepend($('<i class="fa fa-paint-brush" style="margin-left: 1px; margin-right: 6px;"></i>'));
    }
    else if (item.hasClass("action")) {
        item.prepend($('<i class="fa fa-cogs" style="margin-left: 1px; margin-right: 6px;"></i>'));
    }
    else if (item.hasClass("state")) {
        item.prepend($('<i class="fa fa-ellipsis-v" style="margin-left: 4px; margin-right: 8px;"></i>'));
    }
}
function CheckRuleResizeLimits(rule, resourceRuleMode) {
    horizontalLimit = 1000000;
    verticalLimit = 1000000;

    ruleLeft = rule.position().left;
    ruleRight = ruleLeft + rule.width();
    ruleTop = rule.position().top;
    ruleBottom = rule.position().top + rule.height();

    $(resourceRuleMode ? "#resourceRulesPanel .resourceRule" : "#workflowRulesPanel .workflowRule").each(function (index, element) {
        otherRule = $(element);
        if (otherRule.attr("id") != rule.attr("id")) {
            otherRuleLeft = otherRule.position().left;
            otherRuleRight = otherRuleLeft + otherRule.width();
            otherRuleTop = otherRule.position().top;
            otherRuleBottom = otherRule.position().top + otherRule.height();

            if (otherRuleTop < ruleBottom && otherRuleBottom > ruleTop
                && otherRuleLeft + 30 > ruleRight && otherRuleLeft - ruleLeft < horizontalLimit)
                horizontalLimit = otherRuleLeft - ruleLeft;
            if (otherRuleLeft < ruleRight && otherRuleRight > ruleLeft
                && otherRuleTop  + 20 > ruleBottom && otherRuleTop - ruleTop < verticalLimit)
                verticalLimit = otherRuleTop - ruleTop;
        }
    });
    return { horizontal: horizontalLimit, vertical: verticalLimit }
}
function GetItemTypeClass(item) {
    if (item.hasClass("actionItem")) {
        typeClass = "actionItem";
    }
    else if (item.hasClass("attributeItem")) {
        typeClass = "attributeItem";
    }
    else if (item.hasClass("uiItem")) {
        typeClass = "uiItem";
    }
    else if (item.hasClass("roleItem")) {
        typeClass = "roleItem";
    }
    else if (item.hasClass("stateItem")) {
        typeClass = "stateItem";
    }
    else if (item.hasClass("targetItem")) {
        typeClass = "targetItem";
    }
    else if (item.hasClass("templateItem")) {
        typeClass = "templateItem";
    }
    else if (item.hasClass("symbol")) {
        typeClass = "symbol";
    }
    else
        typeClass = "";
    return typeClass;
}
function RecalculateToolboxHeight() {
    var leftBar = $("#tapestryLeftBar");
    var scrollTop = $(window).scrollTop();
    var lowerPanelTop = $("#lowerPanel").offset().top;
    var topBarHeight = $("#topBar").height() + $("#appNotificationArea").height();
    var bottomPanelHeight; 
    if (scrollTop > lowerPanelTop - topBarHeight) {
        bottomPanelHeight = window.innerHeight - topBarHeight;
    } else {
        bottomPanelHeight = $(window).height() + scrollTop - lowerPanelTop - leftBar.position().top;
    }
    leftBar.height(bottomPanelHeight);
    $("#lowerPanelSpinnerOverlay").height(bottomPanelHeight);
    $("#workflowRulesPanel").height($(window).height() - 105);
    $("#tapestryLeftBarMinimized").height($("#workflowRulesPanel").offset().top + $("#workflowRulesPanel").height() - lowerPanelTop);
    
}
function LoadConditionColumns(parent) {
    columnSelect = parent.find(".conditionVariableCell select");
    for (i = 0; i < CurrentTableColumnArray.length; i++) {
        cData = CurrentTableColumnArray[i];
        switch (cData.Type) {
            case "varchar":
                columnType = "string";
                break;
            case "boolean":
                columnType = "bool";
                break;
            case "integer":
                columnType = "int";
                break;
            default:
                columnType = "unknown";
        }
        columnSelect.append($('<option varType="' + columnType + '">' + cData.Name + '</option>'));
    }
    var optionSelected = $("option:selected", columnSelect);
    varType = optionSelected.attr("varType");
    currentCondition = columnSelect.parents("tr");
    currentCondition.find(".conditionOperatorCell select, .conditionValueCell select, .conditionValueCell input").remove();
    switch (varType) {
        case "bool":
            currentCondition.find(".conditionValueCell").append($('<select><option selected="selected">true</option><<option>false</option></select>'));
            currentCondition.find(".conditionOperatorCell").append($('<select><option selected="selected">==</option><option>!=</option></select>'));
            break;
        case "int":
            currentCondition.find(".conditionValueCell").append($('<input type="number"></input>'));
            currentCondition.find(".conditionOperatorCell").append($('<select><option selected="selected">==</option><option>!=</option><option>&gt;</option><option>&gt;=</option><option>&lt;</option><option>&lt;=</option>'));
            break;
        case "string":
            currentCondition.find(".conditionValueCell").append($('<input type="text"></input>'));
            currentCondition.find(".conditionOperatorCell").append($('<select><option selected="selected">==</option><option>!=</option><option>contains</option><option inputType="none">is empty</option><option inputType="none">is not empty</option></select>'));
            break;
        case "unknown":
        default:
            currentCondition.find(".conditionValueCell").append($('<input type="text"></input>'));
            currentCondition.find(".conditionOperatorCell").append($('<select><option selected="selected">==</option><option>!=</option><option>&gt;</option><option>&gt;=</option><option>&lt;</option><option>&lt;=</option><option>contains</option><option inputType="none">is empty</option><option inputType="none">is not empty</option></select>'));
    }
}
var ConditionSetTemplate = '<div class="conditionSet"><div class="conditionSetHeading"><span class="conditionSetPrefix"> a</span>ll of these conditions must be met</div>'
    + '<div class="removeConditionSetIcon">X</div><table class="conditionTable"></table></div>';
var ConditionTemplate = '<tr><td class="conditionOperator"></td><td class="conditionVariableCell"><select></select>'
    + '</td><td class="conditionOperatorCell"><select><option selected="selected">==</option><option>!=</option><option>&gt;</option><option>&gt;=</option><option>&lt;</option><option>&lt;=</option><option>is empty</option><option>is not empty</option></select></td><td class="conditionValueCell">'
    + '<select><option selected="selected">True</option></select></td><td class="conditionActions"><div class="conditionActionIcon addAndConditionIcon">&</div>'
    + '<div class="conditionActionIcon addOrConditionIcon">|</div><div class="conditionActionIcon removeConditionIcon">X</div></td>'
    + '</tr>';
var ManualInputConditionTemplate = '<tr><td class="conditionOperator"></td><td class="conditionVariableCell"><input type="text"></input>'
    + '</td><td class="conditionOperatorCell"><select><option selected="selected">==</option><option>!=</option><option>&gt;</option><option>&gt;=</option><option>&lt;</option><option>&lt;=</option><option inputType="none">is empty</option><option inputType="none">is not empty</option><option>contains</option></select></td><td class="conditionValueCell">'
    + '<input type="text"></input></td><td class="conditionActions"><div class="conditionActionIcon addAndConditionIcon">&</div>'
    + '<div class="conditionActionIcon addOrConditionIcon">|</div><div class="conditionActionIcon removeConditionIcon">X</div></td>'
    + '</tr>';

var AssociatedPageIds = [];

function SaveBlock(commitMessage) {
    pageSpinner.show();
    resourceRulesArray = [];
    workflowRulesArray = [];
    portTargetsArray = [];
    saveId = 0;
    $(".activeItem, .processedItem").removeClass("activeItem processedItem");
    $("#resourceRulesPanel .resourceRule").each(function (ruleIndex, ruleDiv) {
        itemArray = [];
        connectionArray = [];
        currentRule = $(ruleDiv);
        currentRule.find(".item").each(function (itemIndex, itemDiv) {
            currentItem = $(itemDiv);
            currentItem.attr("saveId", saveId);
            saveId++;
            itemArray.push({
                Id: currentItem.attr("saveId"),
                Label: currentItem.text(),
                TypeClass: GetItemTypeClass(currentItem),
                PositionX: parseInt(currentItem.css("left")),
                PositionY: parseInt(currentItem.css("top")),
                ActionId: currentItem.attr("actionid"),
                StateId: currentItem.attr("stateid"),
                PageId: currentItem.attr("pageId"),
                ComponentName: currentItem.attr("componentName"),
                TableName: currentItem.attr("tableName"),
                ColumnName: currentItem.attr("columnName"),
                ColumnFilter: currentItem.data("columnFilter"),
                ConditionSets: currentItem.data("conditionSets")
            });
        });
        currentInstance = currentRule.data("jsPlumbInstance");
        jsPlumbConnections = currentInstance.getAllConnections();
        for (i = 0; i < jsPlumbConnections.length; i++) {
            currentConnection = jsPlumbConnections[i];
            sourceDiv = $(currentConnection.source);
            targetDiv = $(currentConnection.target);
            connectionArray.push({
                SourceId: sourceDiv.attr("saveId"),
                SourceSlot: 0,
                TargetId: targetDiv.attr("saveId"),
                TargetSlot: 0
            });
        }
        resourceRulesArray.push({
            Id: ruleIndex,
            Width: parseInt(currentRule.css("width")),
            Height: parseInt(currentRule.css("height")),
            PositionX: parseInt(currentRule.css("left")),
            PositionY: parseInt(currentRule.css("top")),
            ResourceItems: itemArray,
            Connections: connectionArray
        });
    });
    $("#workflowRulesPanel .workflowRule").each(function (ruleIndex, ruleDiv) {
        swimlanesArray = [];
        currentRule = $(ruleDiv);
        currentRule.find(".swimlane").each(function (swimlaneIndex, swimlaneDiv) {
            currentSwimlane = $(swimlaneDiv);
            currentSwimlane.attr("swimlaneIndex", swimlaneIndex);
            rolesArray = [];
            itemArray = [];
            symbolArray = [];
            connectionArray = [];
            currentSwimlane.find(".swimlaneRolesArea .roleItem").each(function (roleIndex, roleDiv) {
                rolesArray.push($(roleDiv).text());
            });
            currentSwimlane.find(".item, .symbol").each(function (itemIndex, itemDiv) {
                currentItem = $(itemDiv);
                currentItem.attr("saveId", saveId);
                saveId++;
                itemArray.push({
                    Id: currentItem.attr("saveId"),
                    Label: currentItem.find(".itemLabel").text(),
                    TypeClass: GetItemTypeClass(currentItem),
                    DialogType: currentItem.attr("dialogType"),
                    StateId: currentItem.attr("stateid"),
                    TargetId: currentItem.attr("targetid"), 
                    PositionX: parseInt(currentItem.css("left")),
                    PositionY: parseInt(currentItem.css("top")),
                    ActionId: currentItem.attr("actionid"),
                    InputVariables: currentItem.data("inputVariables"),
                    OutputVariables: currentItem.data("outputVariables"),
                    PageId: currentItem.attr("pageId"),
                    ComponentName: currentItem.attr("componentName"),
                    isAjaxAction: currentItem.data("isAjaxAction"),
                    Condition: currentItem.data("condition"),
                    ConditionSets: currentItem.data("conditionSets"),
                    SymbolType: currentItem.attr("symbolType")
                });
            });
            swimlanesArray.push({
                SwimlaneIndex: swimlaneIndex,
                Height: parseInt(currentSwimlane.css("height")),
                Roles: rolesArray,
                WorkflowItems: itemArray
            });
        });
        currentInstance = currentRule.data("jsPlumbInstance");
        jsPlumbConnections = currentInstance.getAllConnections();
        for (i = 0; i < jsPlumbConnections.length; i++) {
            currentConnection = jsPlumbConnections[i];
            sourceDiv = $(currentConnection.source);
            targetDiv = $(currentConnection.target);
            sourceEndpointUuid = currentConnection.endpoints[0].getUuid();
            if (sourceEndpointUuid.match("BottomCenter$"))
                sourceSlot = 1;
            else
                sourceSlot = 0;
            if (!sourceDiv.hasClass("subSymbol")) {
                connectionArray.push({
                    SourceId: sourceDiv.attr("saveId"),
                    SourceSlot: sourceSlot,
                    TargetId: targetDiv.attr("saveId"),
                    TargetSlot: 0
                });
            }
        }
        workflowRulesArray.push({
            Id: ruleIndex,
            Name: currentRule.find(".workflowRuleHeader .verticalLabel").text(),
            Width: parseInt(currentRule.css("width")),
            Height: parseInt(currentRule.css("height")),
            PositionX: parseInt(currentRule.css("left")),
            PositionY: parseInt(currentRule.css("top")),
            Swimlanes: swimlanesArray,
            Connections: connectionArray
        });
    });
    toolboxState = {
        Actions: [],
        Attributes: [],
        UiComponents: [],
        Roles: [],
        States: [],
        Targets: [],
        Templates: [],
        Integrations: []
    }
    $(".tapestryToolbox .toolboxItem").each(function (itemIndex, itemDiv) {
        toolboxItem = $(itemDiv);
        toolboxItemData = {
            Label: toolboxItem.find(".itemLabel").text(),
            ActionId: toolboxItem.attr("ActionId"),
            TableName: toolboxItem.attr("TableName") ? toolboxItem.attr("TableName") : null,
            ColumnName: toolboxItem.attr("ColumnName") ? toolboxItem.attr("ColumnName") : null,
            PageId: toolboxItem.attr("PageId"),
            ComponentName: toolboxItem.attr("ComponentName") ? toolboxItem.attr("ComponentName") : null,
            StateId: toolboxItem.attr("StateId"),
            TargetName: toolboxItem.attr("TargetName") ? toolboxItem.attr("TargetName") : null,
            TargetId: toolboxItem.attr("TargetId")
        }
        if (toolboxItem.hasClass("actionItem")) {
            toolboxItemData.TypeClass = "actionItem";
            toolboxState.Actions.push(toolboxItemData);
        }
        else if (toolboxItem.hasClass("attributeItem")) {
            toolboxItemData.TypeClass = "attributeItem";
            toolboxState.Attributes.push(toolboxItemData);
        }
        else if (toolboxItem.hasClass("uiItem")) {
            toolboxItemData.TypeClass = "uiItem";
            toolboxState.UiComponents.push(toolboxItemData);
        }
        else if (toolboxItem.hasClass("roleItem")) {
            toolboxItemData.TypeClass = "roleItem";
            toolboxState.Roles.push(toolboxItemData);
        }
        else if (toolboxItem.hasClass("stateItem")) {
            toolboxItemData.TypeClass = "stateItem";
            toolboxState.States.push(toolboxItemData);
        }
        else if (toolboxItem.hasClass("targetItem")) {
            toolboxItemData.TypeClass = "targetItem";
            toolboxState.Targets.push(toolboxItemData);
        }
        else if (toolboxItem.hasClass("templateItem")) {
            toolboxItemData.TypeClass = "templateItem";
            toolboxState.Templates.push(toolboxItemData);
        }
        else if (toolboxItem.hasClass("integrationItem")) {
            toolboxItemData.TypeClass = "integrationItem";
            toolboxState.Integrations.push(toolboxItemData);
        }
    });
    postData = {
        CommitMessage: commitMessage,
        Name: $("#blockHeaderBlockName").text(),
        ResourceRules: resourceRulesArray,
        WorkflowRules: workflowRulesArray,
        PortTargets: portTargetsArray,
        ModelTableName: ModelTableName,
        AssociatedTableName: AssociatedTableName,
        AssociatedPageIds: AssociatedPageIds,
        AssociatedTableIds: AssociatedTableIds,
        RoleWhitelist: RoleWhitelist,
        ToolboxState: toolboxState,
        ParentMetablockId: $("#parentMetablockId").val()
    }    
    appId = $("#currentAppId").val();
    blockId = $("#currentBlockId").val();
    $.ajax({
        type: "POST",
        url: "/api/tapestry/apps/" + appId + "/blocks/" + blockId,
        data: postData,
        complete: function () {
            pageSpinner.hide()
        },
        success: function () {
            ChangedSinceLastSave = false;
        }
    });
}

function LoadBlock(commitId) {
    pageSpinner.show();

    appId = $("#currentAppId").val();
    blockId = $("#currentBlockId").val();
    if (commitId) {
        url = "/api/tapestry/apps/" + appId + "/blocks/" + blockId + "/commits/" + commitId;
    } else {
        url = "/api/tapestry/apps/" + appId + "/blocks/" + blockId;
    }

    $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        complete: function () {
            pageSpinner.hide()
        },
        success: function (data) {
            ChangedSinceLastSave = false;
            $("#resourceRulesPanel .resourceRule").remove();
            $("#workflowRulesPanel .workflowRule").remove();
            $("#blockHeaderBlockName").text(data.Name);
            for (i = 0; i < data.ResourceRules.length; i++) {
                currentRuleData = data.ResourceRules[i];
                newRule = $('<div class="rule resourceRule" style="width: '+currentRuleData.Width+'px; height: '+currentRuleData.Height+'px; left: '
                    + currentRuleData.PositionX + 'px; top: ' + currentRuleData.PositionY + 'px;"></div>');
                newRule.attr("id", AssingID());
                $("#resourceRulesPanel .scrollArea").append(newRule);
                newRule.draggable({
                    containment: "parent",
                    revert: function (event, ui) {
                        return ($(this).collision("#resourceRulesPanel .resourceRule").length > 1);
                    },
                    stop: function (event, ui) {
                        ChangedSinceLastSave = true;
                    }
                });
                newRule.resizable({
                    start: function (event, ui) {
                        rule = $(this);
                        contentsWidth = 120;
                        contentsHeight = 40;
                        rule.find(".item").each(function (index, element) {
                            rightEdge = $(element).position().left + $(element).width();
                            if (rightEdge > contentsWidth)
                                contentsWidth = rightEdge;
                            bottomEdge = $(element).position().top + $(element).height();
                            if (bottomEdge > contentsHeight)
                                contentsHeight = bottomEdge;
                        });
                        rule.css("min-width", contentsWidth + 40);
                        rule.css("min-height", contentsHeight + 20);

                        limits = CheckRuleResizeLimits(rule, true);
                        rule.css("max-width", limits.horizontal - 10);
                        rule.css("max-height", limits.vertical - 10);
                    },
                    resize: function (event, ui) {
                        rule = $(this);
                        limits = CheckRuleResizeLimits(rule, true);
                        rule.css("max-width", limits.horizontal - 10);
                        rule.css("max-height", limits.vertical - 10);
                    },
                    stop: function (event, ui) {
                        instance = $(this).data("jsPlumbInstance");
                        instance.recalculateOffsets();
                        instance.repaintEverything();
                        ChangedSinceLastSave = true;
                    }
                });
                CreateJsPlumbInstanceForRule(newRule);
                newRule.droppable({
                    containment: ".resourceRule",
                    tolerance: "touch",
                    accept: ".toolboxItem",
                    greedy: true,
                    drop: function (e, ui) {
                        if (dragModeActive) {
                            dragModeActive = false;
                            droppedElement = ui.helper.clone();
                            droppedElement.removeClass("toolboxItem");
                            droppedElement.addClass("item");
                            droppedElement.css({ width: "", height: "" });
                            $(this).append(droppedElement);
                            ruleContent = $(this);
                            leftOffset = $("#tapestryWorkspace").offset().left - ruleContent.offset().left + 20;
                            topOffset = $("#tapestryWorkspace").offset().top - ruleContent.offset().top;
                            droppedElement.offset({ left: droppedElement.offset().left + leftOffset, top: droppedElement.offset().top + topOffset });
                            ui.helper.remove();
                            AddToJsPlumb(droppedElement);
                            if (droppedElement.position().left + droppedElement.width() + 35 > ruleContent.width()) {
                                droppedElement.css("left", ruleContent.width() - droppedElement.width() - 40);
                                instance = ruleContent.data("jsPlumbInstance");
                                instance.repaintEverything();
                            }
                            if (droppedElement.position().top + droppedElement.height() + 5 > ruleContent.height()) {
                                droppedElement.css("top", ruleContent.height() - droppedElement.height() - 15);
                                instance = ruleContent.data("jsPlumbInstance");
                                instance.repaintEverything();
                            }
                            ChangedSinceLastSave = true;
                        }
                    }
                });
                for (j = 0; j < currentRuleData.ResourceItems.length; j++) {
                    currentItemData = currentRuleData.ResourceItems[j];
                    newItem = $('<div id="resItem' + currentItemData.Id + '" class="item" style="left: ' + currentItemData.PositionX + 'px; top: '
                        + currentItemData.PositionY + 'px;">'
                        + currentItemData.Label + '</div>');
                    if (currentItemData.ActionId != null)
                        newItem.attr("actionId", currentItemData.ActionId);
                    if (currentItemData.StateId != null)
                        newItem.attr("stateId", currentItemData.StateId);
                    if (currentItemData.PageId != null)
                        newItem.attr("pageId", currentItemData.PageId);
                    if (currentItemData.ComponentName != null)
                        newItem.attr("componentName", currentItemData.ComponentName);
                    if (currentItemData.TableName != null) {
                        newItem.data("columnFilter", currentItemData.ColumnFilter);
                        newItem.attr("tableName", currentItemData.TableName);
                        if (currentItemData.Label.indexOf("View:") == 0)
                            newItem.addClass("viewAttribute");
                        else
                            newItem.addClass("tableAttribute");
                    }
                    if (currentItemData.ColumnName != null) {
                        newItem.attr("columnName", currentItemData.ColumnName);
                    }
                    if (currentItemData.ConditionSets != null) {
                        newItem.data("conditionSets", currentItemData.ConditionSets);
                    }
                    newItem.addClass(currentItemData.TypeClass);
                    newRule.append(newItem);
                    AddToJsPlumb(newItem);
                }
                currentInstance = newRule.data("jsPlumbInstance");
                for (j = 0; j < currentRuleData.Connections.length; j++) {
                    currentConnectionData = currentRuleData.Connections[j];
                    currentInstance.connect({
                        uuids: ["resItem" + currentConnectionData.SourceId + "RightMiddle"], target: "resItem" + currentConnectionData.TargetId
                    });
                }
            }
            for (i = 0; i < data.WorkflowRules.length; i++) {
                currentRuleData = data.WorkflowRules[i];
                newRule = $('<div class="rule workflowRule" style="width: ' + currentRuleData.Width + 'px; height: ' + currentRuleData.Height
                    + 'px; left: ' + currentRuleData.PositionX + 'px; top: ' + currentRuleData.PositionY + 'px;"><div class="workflowRuleHeader">'
                    + '<div class="verticalLabel" style="margin-top: 0px;">' + currentRuleData.Name + '</div></div><div class="swimlaneArea"></div></div>');
                newRule.attr("id", AssingID());
                $("#workflowRulesPanel .scrollArea").append(newRule);
                newRule.draggable({
                    containment: "parent",
                    handle: ".workflowRuleHeader",
                    revert: function (event, ui) {
                        return ($(this).collision("#workflowRulesPanel .workflowRule").length > 1);
                    },
                    stop: function (event, ui) {
                        ChangedSinceLastSave = true;
                    }
                });
                newRule.resizable({
                    start: function (event, ui) {
                        rule = $(this);
                        contentsWidth = 120;
                        contentsHeight = 40;
                        rule.find(".item").each(function (index, element) {
                            rightEdge = $(element).position().left + $(element).width();
                            if (rightEdge > contentsWidth)
                                contentsWidth = rightEdge;
                            bottomEdge = $(element).position().top + $(element).height();
                            if (bottomEdge > contentsHeight)
                                contentsHeight = bottomEdge;
                        });
                        rule.css("min-width", contentsWidth + 40);
                        rule.css("min-height", contentsHeight + 20);

                        limits = CheckRuleResizeLimits(rule, false);
                        rule.css("max-width", limits.horizontal - 10);
                        rule.css("max-height", limits.vertical - 10);
                    },
                    resize: function (event, ui) {
                        rule = $(this);
                        instance = rule.data("jsPlumbInstance");
                        instance.recalculateOffsets();
                        instance.repaintEverything();
                        limits = CheckRuleResizeLimits(rule, false);
                        rule.css("max-width", limits.horizontal - 10);
                        rule.css("max-height", limits.vertical - 10);
                    },
                    stop: function (event, ui) {
                        ChangedSinceLastSave = true;
                    }
                });
                CreateJsPlumbInstanceForRule(newRule);
                for (j = 0; j < currentRuleData.Swimlanes.length; j++) {
                    currentSwimlaneData = currentRuleData.Swimlanes[j];
                    newSwimlane = $('<div class="swimlane" style="height: ' + (100 / currentRuleData.Swimlanes.length) + '%;"><div class="swimlaneRolesArea"><div class="roleItemContainer"></div><div class="rolePlaceholder"><div class="rolePlaceholderLabel">Pokud chcete specifikovat roli<br />'
                        + 'přetáhněte ji do této oblasti</div></div></div><div class="swimlaneContentArea"></div></div>');
                    newRule.find(".swimlaneArea").append(newSwimlane);
                    if (currentSwimlaneData.Roles.length > 0)
                        newSwimlane.find(".swimlaneRolesArea .rolePlaceholder").remove();
                    for (k = 0; k < currentSwimlaneData.Roles.length; k++) {
                        newSwimlane.find(".swimlaneRolesArea .roleItemContainer").append($('<div class="roleItem">' + currentSwimlaneData.Roles[k] + '</div>'));
                    }
                    for (k = 0; k < currentSwimlaneData.WorkflowItems.length; k++) {
                        currentItemData = currentSwimlaneData.WorkflowItems[k];
                        if (currentItemData.TypeClass === "symbol" && currentItemData.SymbolType === "comment") {
                            newItem = $('<div id="wfItem' + currentItemData.Id + '" class="symbol" symbolType="comment" endpoints="final" style="left: ' + currentItemData.PositionX +
                            'px; top: ' + currentItemData.PositionY + 'px; width: 30px; padding: 3px; border: 2px solid grey; border-right: none; min-height: 60px;"> <span class="itemLabel">'
                            + currentItemData.Label + '</span></div>');
                        }else if (currentItemData.TypeClass == "symbol") {
                            newItem = $('<img id="wfItem' + currentItemData.Id + '" class="symbol" symbolType="' + currentItemData.SymbolType +
                            '" src="/Content/images/TapestryIcons/' + currentItemData.SymbolType + '.png" style="left: ' + currentItemData.PositionX + 'px; top: '
                            + currentItemData.PositionY + 'px;" />');
                        }else{
                            newItem = $('<div id="wfItem' + currentItemData.Id + '" class="item" style="left: ' + currentItemData.PositionX + 'px; top: '
                            + currentItemData.PositionY + 'px;"><span class="itemLabel">' + currentItemData.Label + '</span></div>');
                        }
                        newItem.addClass(currentItemData.TypeClass);
                        if (currentItemData.ActionId != null)
                            newItem.attr('actionId', currentItemData.ActionId);
                        if (currentItemData.InputVariables != null)
                            newItem.data('inputVariables', currentItemData.InputVariables);
                        if (currentItemData.OutputVariables != null)
                            newItem.data('outputVariables', currentItemData.OutputVariables);
                        if (currentItemData.PageId != null)
                            newItem.attr("pageId", currentItemData.PageId);
                        if (currentItemData.ComponentName != null)
                            newItem.attr('componentName', currentItemData.ComponentName);
                        if (currentItemData.TargetId != null)
                            newItem.attr('targetId', currentItemData.TargetId);
                        if (currentItemData.StateId != null)
                            newItem.attr("stateId", currentItemData.StateId);
                        if (currentItemData.isAjaxAction != null)
                            newItem.data('isAjaxAction', currentItemData.isAjaxAction);
                        if (currentItemData.TypeClass == "circle-thick")
                            newItem.attr("endpoints", "final");
                        if (currentItemData.TypeClass && currentItemData.TypeClass.substr(0, 8) == "gateway-")
                            newItem.attr("endpoints", "gateway");
                        if (currentItemData.Condition != null)
                            newItem.data("condition", currentItemData.Condition);
                        if (currentItemData.ConditionSets != null) {
                            newItem.data("conditionSets", currentItemData.ConditionSets);
                        }
                        targetSwimlane = newRule.find(".swimlane").eq(currentSwimlaneData.SwimlaneIndex).find(".swimlaneContentArea");
                        targetSwimlane.append(newItem);
                        AddToJsPlumb(newItem);
                    }
                }
                newRule.find(".swimlaneRolesArea").droppable({
                    tolerance: "touch",
                    accept: ".toolboxItem.roleItem",
                    greedy: true,
                    drop: function (e, ui) {
                        if (dragModeActive) {
                            dragModeActive = false;
                            roleExists = false;
                            $(this).find(".roleItem").each(function (index, element) {
                                if ($(element).text() == ui.helper.text())
                                    roleExists = true;
                            });
                            if (!roleExists) {
                                droppedElement = ui.helper.clone();
                                $(this).find(".rolePlaceholder").remove();
                                $(this).find(".roleItemContainer").append($('<div class="roleItem">' + droppedElement.text() + '</div>'));
                                ui.helper.remove();
                                ChangedSinceLastSave = true;
                            }
                        }
                    }
                });
                newRule.find(".swimlaneContentArea").droppable({
                    containment: ".swimlaneContentArea",
                    tolerance: "touch",
                    accept: ".toolboxSymbol, .toolboxItem",
                    greedy: false,
                    drop: function (e, ui) {
                        if (dragModeActive) {
                            dragModeActive = false;
                            droppedElement = ui.helper.clone();
                            if (droppedElement.hasClass("roleItem")) {
                                ui.draggable.draggable("option", "revert", true);
                                return false;
                            }
                            ruleContent = $(this);
                            ruleContent.append(droppedElement);
                            if (droppedElement.hasClass("toolboxSymbol")) {
                                droppedElement.removeClass("toolboxSymbol ui-draggable ui-draggable-dragging");
                                droppedElement.addClass("symbol");
                                droppedElement.css({ height: "" });
                                leftOffset = $("#tapestryWorkspace").offset().left - ruleContent.offset().left;
                                topOffset = $("#tapestryWorkspace").offset().top - ruleContent.offset().top;
                            }
                            else {
                                droppedElement.removeClass("toolboxItem");
                                droppedElement.addClass("item");
                                droppedElement.css({ width: "", height: "" });
                                leftOffset = $("#tapestryWorkspace").offset().left - ruleContent.offset().left + 38;
                                topOffset = $("#tapestryWorkspace").offset().top - ruleContent.offset().top - 18;
                            }
                            droppedElement.offset({ left: droppedElement.offset().left + leftOffset, top: droppedElement.offset().top + topOffset });
                            ui.helper.remove();
                            AddToJsPlumb(droppedElement);
                            if (droppedElement.position().top + droppedElement.height() + 10 > ruleContent.height()) {
                                droppedElement.css("top", ruleContent.height() - droppedElement.height() - 20);
                                instance = ruleContent.parents(".workflowRule").data("jsPlumbInstance");
                                instance.repaintEverything();
                            }
                            ChangedSinceLastSave = true;
                        }
                    }
                });
                currentInstance = newRule.data("jsPlumbInstance");
                for (j = 0; j < currentRuleData.Connections.length; j++) {
                    currentConnectionData = currentRuleData.Connections[j];
                    sourceId = "wfItem" + currentConnectionData.SourceId;
                    targetId = "wfItem" + currentConnectionData.TargetId;
                    if (currentConnectionData.SourceSlot == 1)
                        sourceEndpointUuid = "BottomCenter";
                    else
                        sourceEndpointUuid = "RightMiddle";
                    currentInstance.connect({ uuids: [sourceId + sourceEndpointUuid], target: targetId });
                }
            }
            RoleWhitelist = data.RoleWhitelist;
            $("#blockHeaderRolesCount").text(RoleWhitelist.length);
            appId = $("#currentAppId").val();
            pageSpinner.show();
            $.ajax({
                type: "GET",
                url: "/api/database/apps/" + appId + "/commits/latest",
                dataType: "json",
                complete: function () {
                    pageSpinner.hide()
                },
                success: function (tableData) {
                    attributesInToolboxState = data.ToolboxState ? data.ToolboxState.Attributes : [];
                    $(".tapestryToolbox .toolboxLi_Attributes").remove();
                    for (tableIndex = 0; tableIndex < tableData.Tables.length; tableIndex++) {
                        attributeLibId = ++lastLibId;
                        attributeLibraryItem = $('<div libId="' + ++attributeLibId + '" libType="table-attribute" class="libraryItem tableAttribute" tableName="'
                            + tableData.Tables[tableIndex].Name + '">Table: ' + tableData.Tables[tableIndex].Name + '</div>')
                        $("#libraryCategory-Attributes").append(attributeLibraryItem);
                        attributeMatch = attributesInToolboxState.filter(function (value) {
                            return !value.ColumnName && value.TableName == tableData.Tables[tableIndex].Name;
                        }).length;
                        if (attributeMatch) {
                            newToolboxLiAttribute = $('<li libId="' + attributeLibId + '" class="toolboxLi toolboxLi_Attributes"><div class="toolboxItem attributeItem tableAttribute" tableName="' + tableData.Tables[tableIndex].Name + '">'
                                + '<span class="itemLabel">Table: ' + tableData.Tables[tableIndex].Name + '</span></div></li>');
                            $(".tapestryToolbox .toolboxCategoryHeader_UI").before(newToolboxLiAttribute);
                            ToolboxItemDraggable(newToolboxLiAttribute);
                            attributeLibraryItem.addClass("highlighted");
                        }
                    }
                    for (viewIndex = 0; viewIndex < tableData.Views.length; viewIndex++) {
                        attributeLibId = ++lastLibId;
                        attributeLibraryItem = $('<div libId="' + ++attributeLibId + '" libType="view-attribute" class="libraryItem viewAttribute" tableName="'
                            + tableData.Views[viewIndex].Name + '">View: ' + tableData.Views[viewIndex].Name + '</div>')
                        $("#libraryCategory-Attributes").append(attributeLibraryItem);
                        attributeMatch = attributesInToolboxState.filter(function (value) {
                            return !value.ColumnName && value.TableName == tableData.Views[viewIndex].Name;
                        }).length;
                        if (attributeMatch) {
                            newToolboxLiAttribute = $('<li libId="' + attributeLibId + '" class="toolboxLi toolboxLi_Attributes"><div class="toolboxItem attributeItem viewAttribute" tableName="' + tableData.Views[viewIndex].Name + '">'
                                + '<span class="itemLabel">View: ' + tableData.Views[viewIndex].Name + '</span></div></li>');
                            $(".tapestryToolbox .toolboxCategoryHeader_UI").before(newToolboxLiAttribute);
                            ToolboxItemDraggable(newToolboxLiAttribute);
                            attributeLibraryItem.addClass("highlighted");
                        }
                    }
                    AssociatedTableIds = data.AssociatedTableIds;
                    AssociatedTableName = data.AssociatedTableName;
                    ModelTableName = data.ModelTableName;
                    $("#blockHeaderDbResCount").text(data.AssociatedTableName.length);
                    somethingWasAdded = false;
                    for (tableIndex = 0; tableIndex < data.AssociatedTableName.length; tableIndex++) {
                        currentTable = tableData.Tables.filter(function (value) {
                            return value.Name == data.AssociatedTableName[tableIndex];
                        })[0];
                        if (currentTable != undefined) {
                            for (columnIndex = 0; columnIndex < currentTable.Columns.length; columnIndex++) {
                                attributeLibId = ++lastLibId;
                                attributeLibraryItem = $('<div libId="' + attributeLibId + '" libType="column-attribute" class="libraryItem columnAttribute" tableName="'
                                    + currentTable.Name + '" columnName="' + currentTable.Columns[columnIndex].Name + '">' + currentTable.Name + '.' + currentTable.Columns[columnIndex].Name + '</div>');
                                $("#libraryCategory-Attributes").append(attributeLibraryItem);
                                attributeMatch = attributesInToolboxState.filter(function (value) {
                                    return value.ColumnName == currentTable.Columns[columnIndex].Name && value.TableName == currentTable.Name;
                                }).length;
                                if (attributeMatch) {
                                    newToolboxLiAttribute = $('<li libId="' + attributeLibId + '" class="toolboxLi toolboxLi_Attributes"><div class="toolboxItem attributeItem tableAttribute" tableName="' + currentTable.Name + '" columnName="' + currentTable.Columns[columnIndex].Name + '"><span class="itemLabel">'
                                        + currentTable.Name + '.' + currentTable.Columns[columnIndex].Name + '</span></div></li>');
                                    $(".tapestryToolbox .toolboxCategoryHeader_UI").before(newToolboxLiAttribute);
                                    ToolboxItemDraggable(newToolboxLiAttribute);
                                    attributeLibraryItem.addClass("highlighted");
                                }
                            }
                        }
                        systemTable = SystemTables.filter(function (value) {
                            return value.Name == data.AssociatedTableName[tableIndex];
                        })[0];
                        if (systemTable)
                            for (i = 0; i < systemTable.Columns.length; i++) {
                                $("#libraryCategory-Attributes").append($('<div libId="' + ++lastLibId + '" libType="column-attribute" class="libraryItem columnAttribute" tableName="'
                                    + systemTable.Name + '" columnName="' + systemTable.Columns[i] + '">' + systemTable.Name + '.' + systemTable.Columns[i] + '</div>'));
                            }
                    };
                }
            });
            
            pageSpinner.show();
            $('.libraryItem').remove();
            $.ajax({
                type: "GET",
                url: "/api/tapestry/actions",
                dataType: "json",
                complete: function () {
                    pageSpinner.hide()
                },
                success: function (actionData) {
                    actionsInToolboxState = data.ToolboxState ? data.ToolboxState.Actions : [];
                    $(".tapestryToolbox .toolboxLi_Actions").remove();
                    for (actionIndex = 0; actionIndex < actionData.Items.length; actionIndex++)
                    {
                        actionLibId = ++lastLibId;
                        actionLibraryItem = $('<div libId="' + actionLibId + '" libType="action" class="libraryItem" actionId="' + actionData.Items[actionIndex].Id + '">' + actionData.Items[actionIndex].Name + '</div>');
                        $('#libraryCategory-Actions').append(actionLibraryItem);
                        actionMatch = actionsInToolboxState.filter(function (value) {
                            return value.ActionId == actionData.Items[actionIndex].Id;
                        }).length;
                        if (actionMatch) {
                            newToolboxLiAction = $('<li libId="' + actionLibId + '" class="toolboxLi toolboxLi_Actions"><div class="toolboxItem actionItem" actionId="' + actionData.Items[actionIndex].Id + '"><span class="itemLabel">'
                            + actionData.Items[actionIndex].Name + '</span></div></li>');
                            $(".tapestryToolbox .toolboxCategoryHeader_Attributes").before(newToolboxLiAction);
                            ToolboxItemDraggable(newToolboxLiAction);
                            actionLibraryItem.addClass("highlighted");
                        }
                    }
                }
            });
            pageSpinner.show();
            $.ajax({
                type: "GET",
                url: "/api/Persona/app-roles/" + appId,
                dataType: "json",
                complete: function () {
                    pageSpinner.hide()
                },
                success: function (roleData) {
                    rolesInToolboxState = data.ToolboxState ? data.ToolboxState.Roles : [];
                    $(".tapestryToolbox .toolboxLi_Roles").remove();
                    for (roleIndex = 0; roleIndex < roleData.Roles.length; roleIndex++) {
                        roleLibId = ++lastLibId;
                        roleLibraryItem = $('<div libId="' + roleLibId + '" libType="role" class="libraryItem">' + roleData.Roles[roleIndex].Name + '</div>');
                        $('#libraryCategory-Roles').append(roleLibraryItem);
                        roleMatch = rolesInToolboxState.filter(function (value) {
                            return value.Label == roleData.Roles[roleIndex].Name;
                        }).length;
                        if (roleMatch) {
                            newToolboxLiRole = $('<li libId="' + roleLibId + '" class="toolboxLi toolboxLi_Roles"><div class="toolboxItem roleItem"><span class="itemLabel">'
                            + roleData.Roles[roleIndex].Name + '</span></div></li>');
                            $(".tapestryToolbox .toolboxCategoryHeader_States").before(newToolboxLiRole);
                            ToolboxItemDraggable(newToolboxLiRole);
                            roleLibraryItem.addClass("highlighted");
                        }
                    }
                }
            });
            pageSpinner.show();
            $.ajax({
                type: "GET",
                url: "/api/Persona/app-states/" + appId,
                dataType: "json",
                complete: function () {
                    pageSpinner.hide()
                },
                success: function (stateData) {
                    statesInToolboxState = data.ToolboxState ? data.ToolboxState.States : [];
                    $(".tapestryToolbox .toolboxLi_States").remove();
                    for (stateIndex = 0; stateIndex < stateData.States.length; stateIndex++) {
                        stateLibId = ++lastLibId;
                        stateLibraryItem = $('<div libId="' + stateLibId + '" libType="state" class="libraryItem" stateId="' + stateData.States[stateIndex].Id + '">' + stateData.States[stateIndex].Name + '</div>');
                        $('#libraryCategory-States').append(stateLibraryItem);
                        stateMatch = statesInToolboxState.filter(function (value) {
                            return value.StateId == stateData.States[stateIndex].Id;
                        }).length;
                        if (stateMatch) {
                            newToolboxLiState = $('<li libId="' + stateLibId + '" class="toolboxLi toolboxLi_States"><div class="toolboxItem stateItem" stateId="' + stateData.States[stateIndex].Id + '"><span class="itemLabel">'
                            + stateData.States[stateIndex].Name + '</span></div></li>');
                            $(".tapestryToolbox .toolboxCategoryHeader_Targets").before(newToolboxLiState);
                            ToolboxItemDraggable(newToolboxLiState);
                            stateLibraryItem.addClass("highlighted");
                        }
                    }
                }
            });
            pageSpinner.show();
            $.ajax({
                type: "GET",
                url: "/api/tapestry/apps/" + appId + "/blocks",
                dataType: "json",
                complete: function () {
                    pageSpinner.hide()
                },
                success: function (targetData) {
                    targetsInToolboxState = data.ToolboxState ? data.ToolboxState.Targets : [];
                    $(".tapestryToolbox .toolboxLi_Targets").remove();
                    for (targetIndex = 0; targetIndex < targetData.ListItems.length; targetIndex++) {
                        targetLibId = ++lastLibId;
                        targetLibraryItem = $('<div libId="' + targetLibId + '" libType="target" class="libraryItem" targetId="' + targetData.ListItems[targetIndex].Id + '">' + targetData.ListItems[targetIndex].Name + '</div>');
                        $('#libraryCategory-Targets').append(targetLibraryItem);
                        targetMatch = targetsInToolboxState.filter(function (value) {
                            return value.TargetId == targetData.ListItems[targetIndex].Id;
                        }).length;
                        if (targetMatch) {
                            newToolboxLiTarget = $('<li libId="' + targetLibId + '" class="toolboxLi toolboxLi_Targets"><div class="toolboxItem targetItem" targetId="' + targetData.ListItems[targetIndex].Id + '"><span class="itemLabel">'
                            + targetData.ListItems[targetIndex].Name + '</span></div></li>');
                            $(".tapestryToolbox .toolboxCategoryHeader_Templates").before(newToolboxLiTarget);
                            ToolboxItemDraggable(newToolboxLiTarget);
                            targetLibraryItem.addClass("highlighted");
                        }
                    }
                }
            });
            pageSpinner.show();
            $.ajax({
                type: "GET",
                url: "/api/hermes/" + appId + "/templates",
                dataType: "json",
                complete: function () {
                    pageSpinner.hide()
                },
                success: function (templateData) {
                    templatesInToolboxState = data.ToolboxState ? data.ToolboxState.Templates : [];
                    $(".tapestryToolbox .toolboxLi_Templates").remove();
                    for (templateIndex = 0; templateIndex < templateData.length; templateIndex++) {
                        templateLibId = ++lastLibId;
                        templateLibraryItem = $('<div libId="' + templateLibId + '" libType="template" class="libraryItem">' + templateData[templateIndex].Name + '</div>');
                        $('#libraryCategory-Templates').append(templateLibraryItem);
                        templateMatch = templatesInToolboxState.filter(function (value) {
                            return value.Label == templateData[templateIndex].Name;
                        }).length;
                        if (templateMatch) {
                            newToolboxLiIntegration = $('<li libId="' + templateLibId + '" class="toolboxLi toolboxLi_Templates"><div class="toolboxItem templateItem"><span class="itemLabel">'
                                + templateData[templateIndex].Name + '</span></div></li>');
                            $(".tapestryToolbox .toolboxCategoryHeader_Integrations").before(newToolboxLiIntegration);
                            ToolboxItemDraggable(newToolboxLiIntegration);
                            templateLibraryItem.addClass("highlighted");
                        }
                    }
                }
            });
            pageSpinner.show();
            $.ajax({
                type: "GET",
                url: "/api/nexus/" + appId + "/gateways",
                dataType: "json",
                complete: function () {
                    pageSpinner.hide()
                },
                success: function (integrationData) {
                    integrationsInToolboxState = data.ToolboxState ? data.ToolboxState.Integrations : [];
                    $(".tapestryToolbox .toolboxLi_Integrations").remove();
                    for (integrationIndex = 0; integrationIndex < integrationData.Ldap.length; integrationIndex++) {
                        integrationLibId = ++lastLibId;
                        integrationLibraryItem = $('<div libId="' + integrationLibId + '" libType="ldap" class="libraryItem">LDAP: ' + integrationData.Ldap[integrationIndex].Name + '</div>');
                        $('#libraryCategory-Integration').append(integrationLibraryItem);
                        integrationMatch = integrationsInToolboxState.filter(function (value) {
                            return value.Label == "LDAP: " + integrationData.Ldap[integrationIndex].Name;
                        }).length;
                        if (integrationMatch) {
                            newToolboxLiIntegration = $('<li libId="' + integrationLibId + '" class="toolboxLi toolboxLi_Integrations"><div class="toolboxItem integrationItem"><span class="itemLabel">'
                                + 'LDAP: ' + integrationData.Ldap[integrationIndex].Name + '</span></div></li>');
                            $(".tapestryToolbox").append(newToolboxLiIntegration);
                            ToolboxItemDraggable(newToolboxLiIntegration);
                            integrationLibraryItem.addClass("highlighted");
                        }
                    }
                    for (integrationIndex = 0; integrationIndex < integrationData.WS.length; integrationIndex++) {
                        integrationLibId = ++lastLibId;
                        integrationLibraryItem = $('<div libId="' + integrationLibId + '" libType="ws" libSubType="' + integrationData.WS[integrationIndex].Type + '" class="libraryItem">WS: ' + integrationData.WS[integrationIndex].Name + '</div>');
                        $('#libraryCategory-Integration').append(integrationLibraryItem);
                        integrationMatch = integrationsInToolboxState.filter(function (value) {
                            return value.Label == "WS: " + integrationData.WS[integrationIndex].Name;
                        }).length;
                        if (integrationMatch) {
                            newToolboxLiIntegration = $('<li libId="' + integrationLibId + '" class="toolboxLi toolboxLi_Integrations"><div class="toolboxItem integrationItem"><span class="itemLabel">'
                                + 'WS: ' + integrationData.WS[integrationIndex].Name + '</span></div></li>');
                            $(".tapestryToolbox").append(newToolboxLiIntegration);
                            ToolboxItemDraggable(newToolboxLiIntegration);
                            integrationLibraryItem.addClass("highlighted");
                        }
                    }
                    for (integrationIndex = 0; integrationIndex < integrationData.SMTP.length; integrationIndex++) {
                        integrationLibId = ++lastLibId;
                        integrationLibraryItem = $('<div libId="' + integrationLibId + '" libType="smtp" class="libraryItem">SMTP: ' + integrationData.SMTP[integrationIndex].Name + '</div>');
                        $('#libraryCategory-Integration').append(integrationLibraryItem);
                        integrationMatch = integrationsInToolboxState.filter(function (value) {
                            return value.Label == "SMTP: " + integrationData.SMTP[integrationIndex].Name;
                        }).length;
                        if (integrationMatch) {
                            newToolboxLiIntegration = $('<li libId="' + integrationLibId + '" class="toolboxLi toolboxLi_Integrations"><div class="toolboxItem integrationItem"><span class="itemLabel">'
                                + 'SMTP: ' + integrationData.SMTP[integrationIndex].Name + '</span></div></li>');
                            $(".tapestryToolbox").append(newToolboxLiIntegration);
                            ToolboxItemDraggable(newToolboxLiIntegration);
                            integrationLibraryItem.addClass("highlighted");
                        }
                    }
                    for (integrationIndex = 0; integrationIndex < integrationData.WebDAV.length; integrationIndex++) {
                        integrationLibId = ++lastLibId;
                        integrationLibraryItem = $('<div libId="' + integrationLibId + '" libType="smtp" class="libraryItem">WebDAV: ' + integrationData.WebDAV[integrationIndex].Name + '</div>');
                        $('#libraryCategory-Integration').append(integrationLibraryItem);
                        integrationMatch = integrationsInToolboxState.filter(function (value) {
                            return value.Label == "WebDAV: " + integrationData.WebDAV[integrationIndex].Name;
                        }).length;
                        if (integrationMatch) {
                            newToolboxLiIntegration = $('<li libId="' + integrationLibId + '" class="toolboxLi toolboxLi_Integrations"><div class="toolboxItem integrationItem"><span class="itemLabel">'
                                + 'WebDAV: ' + integrationData.WebDAV[integrationIndex].Name + '</span></div></li>');
                            $(".tapestryToolbox").append(newToolboxLiIntegration);
                            ToolboxItemDraggable(newToolboxLiIntegration);
                            integrationLibraryItem.addClass("highlighted");
                        }
                    }
                }
            });

            AssociatedPageIds = data.AssociatedPageIds;
            $("#blockHeaderScreenCount").text(data.AssociatedPageIds.length);
            uicInToolboxState = data.ToolboxState ? data.ToolboxState.UiComponents : [];
            $(".tapestryToolbox .toolboxLi_UI").remove();

            for (pageIndex = 0; pageIndex < data.AssociatedPageIds.length; pageIndex++) {
                pageId = data.AssociatedPageIds[pageIndex];
                pageSpinner.show();
                $.ajax({
                    type: "GET",
                    url: "/api/mozaic-editor/apps/" + appId + "/pages/" + pageId,
                    dataType: "json",
                    complete: function () {
                        pageSpinner.hide()
                    },
                    success: function (uiPageData) {
                        for (componentIndex = 0; componentIndex < uiPageData.Components.length; componentIndex++) {
                            if (componentIndex == 0) {
                                uicLibId = ++lastLibId;
                                uicLibraryItem = $('<div libId="' + uicLibId + '" pageId="' + uiPageData.Id + '" libType="ui" class="libraryItem">Screen: '
                                    + uiPageData.Name + '</div>');
                                $('#libraryCategory-UI').append(uicLibraryItem);
                                uicMatch = uicInToolboxState.filter(function (value) {
                                    return value.PageId == uiPageData.Id && (!value.ComponentName || value.ComponentName == "undefined");
                                }).length;
                                if (uicMatch) {
                                    newToolboxLiUic = $('<li libId="' + uicLibId + '" class="toolboxLi toolboxLi_UI"><div class="toolboxItem uiItem pageUi" pageId="' + uiPageData.Id + '">'
                                        + '<span class="itemLabel">Screen: ' + uiPageData.Name + '</span></div></li>');
                                    $(".tapestryToolbox .toolboxCategoryHeader_Roles").before(newToolboxLiUic);
                                    ToolboxItemDraggable(newToolboxLiUic);
                                    uicLibraryItem.addClass("highlighted");
                                }
                            }

                            uicLibId = ++lastLibId;
                            uicLibraryItem = $('<div libId="' + uicLibId + '" pageId="' + uiPageData.Id + '" componentName="' + uiPageData.Components[componentIndex].Name + '" libType="ui" class="libraryItem">'
                            + uiPageData.Components[componentIndex].Name + '</div>');
                            $('#libraryCategory-UI').append(uicLibraryItem);
                            uicMatch = uicInToolboxState.filter(function (value) {
                                return value.PageId == uiPageData.Id && value.ComponentName == uiPageData.Components[componentIndex].Name;
                            }).length;
                            if (uicMatch) {
                                newToolboxLiUic = $('<li libId="' + uicLibId + '" class="toolboxLi toolboxLi_UI"><div class="toolboxItem uiItem" pageId="' + uiPageData.Id + '" componentName="' + uiPageData.Components[componentIndex].Name + '"><span class="itemLabel">'
                                    + uiPageData.Components[componentIndex].Name + '</span></div></li>');
                                $(".tapestryToolbox .toolboxCategoryHeader_Roles").before(newToolboxLiUic);
                                ToolboxItemDraggable(newToolboxLiUic);
                                uicLibraryItem.addClass("highlighted");
                            }
                            if (uiPageData.Components[componentIndex].Type == "data-table-with-actions") {
                                $("#libraryCategory-UI").append('<div libId="' + ++lastLibId + '" pageId="' + uiPageData.Id + '" componentName="datatable_edit" libType="ui" class="libraryItem">'
                                    + uiPageData.Components[componentIndex].Name + '_EditAction</div>');
                                $("#libraryCategory-UI").append('<div libId="' + ++lastLibId + '" pageId="' + uiPageData.Id + '" componentName="datatable_detail" libType="ui" class="libraryItem">'
                                    + uiPageData.Components[componentIndex].Name + '_DetailsAction</div>');
                                $("#libraryCategory-UI").append('<div libId="' + ++lastLibId + '" pageId="' + uiPageData.Id + '" componentName="datatable_delete" libType="ui" class="libraryItem">'
                                    + uiPageData.Components[componentIndex].Name + '_DeleteAction</div>');
                                $("#libraryCategory-UI").append('<div libId="' + ++lastLibId + '" pageId="' + uiPageData.Id + '" componentName="datatable_actionA" libType="ui" class="libraryItem">'
                                    + uiPageData.Components[componentIndex].Name + '_A_Action</div>');
                                $("#libraryCategory-UI").append('<div libId="' + ++lastLibId + '" pageId="' + uiPageData.Id + '" componentName="datatable_actionB" libType="ui" class="libraryItem">'
                                    + uiPageData.Components[componentIndex].Name + '_B_Action</div>');
                            }
                            if (uiPageData.Components[componentIndex].ChildComponents) {
                                for (childComponentIndex = 0; childComponentIndex < uiPageData.Components[componentIndex].ChildComponents.length; childComponentIndex++) {
                                    uicLibId = ++lastLibId;
                                    uicLibraryItem = $('<div libId="' + uicLibId + '" pageId="' + uiPageData.Id + '" componentName="' + uiPageData.Components[componentIndex].ChildComponents[childComponentIndex].Name + '" libType="ui" class="libraryItem">'
                                    + uiPageData.Components[componentIndex].ChildComponents[childComponentIndex].Name + '</div>');
                                    $('#libraryCategory-UI').append(uicLibraryItem);
                                    uicMatch = uicInToolboxState.filter(function (value) {
                                        return value.PageId == uiPageData.Id && value.ComponentName == uiPageData.Components[componentIndex].ChildComponents[childComponentIndex].Name;
                                    }).length;
                                    if (uicMatch) {
                                        newToolboxLiUic = $('<li libId="' + uicLibId + '" class="toolboxLi toolboxLi_UI"><div class="toolboxItem uiItem" pageId="' + uiPageData.Id + '" componentName="' + uiPageData.Components[componentIndex].ChildComponents[childComponentIndex].Name + '"><span class="itemLabel">'
                                            + uiPageData.Components[componentIndex].ChildComponents[childComponentIndex].Name + '</span></div></li>');
                                        $(".tapestryToolbox .toolboxCategoryHeader_Roles").before(newToolboxLiUic);
                                        ToolboxItemDraggable(newToolboxLiUic);
                                        uicLibraryItem.addClass("highlighted");
                                    }
                                    if (uiPageData.Components[componentIndex].ChildComponents[childComponentIndex].Type == "data-table-with-actions") {
                                        $("#libraryCategory-UI").append('<div libId="' + ++lastLibId + '" pageId="' + uiPageData.Id + '" componentName="datatable_edit" libType="ui" class="libraryItem">'
                                            + uiPageData.Components[componentIndex].ChildComponents[childComponentIndex].Name + '_EditAction</div>');
                                        $("#libraryCategory-UI").append('<div libId="' + ++lastLibId + '" pageId="' + uiPageData.Id + '" componentName="datatable_detail" libType="ui" class="libraryItem">'
                                            + uiPageData.Components[componentIndex].ChildComponents[childComponentIndex].Name + '_DetailsAction</div>');
                                        $("#libraryCategory-UI").append('<div libId="' + ++lastLibId + '" pageId="' + uiPageData.Id + '" componentName="datatable_delete" libType="ui" class="libraryItem">'
                                            + uiPageData.Components[componentIndex].ChildComponents[childComponentIndex].Name + '_DeleteAction</div>');
                                        $("#libraryCategory-UI").append('<div libId="' + ++lastLibId + '" pageId="' + uiPageData.Id + '" componentName="datatable_actionA" libType="ui" class="libraryItem">'
                                            + uiPageData.Components[componentIndex].Name + '_A_Action</div>');
                                        $("#libraryCategory-UI").append('<div libId="' + ++lastLibId + '" pageId="' + uiPageData.Id + '" componentName="datatable_actionB" libType="ui" class="libraryItem">'
                                            + uiPageData.Components[componentIndex].Name + '_B_Action</div>');
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
    });
};

$(function () {
    if (CurrentModuleIs("tapestryModule")) {

        // Resource rules
        $("#resourceRulesPanel .resourceRule").draggable({
            containment: "parent",
            revert: function (event, ui) {
                return ($(this).collision("#resourceRulesPanel .resourceRule").length > 1);
            },
            stop: function (event, ui) {
                ChangedSinceLastSave = true;
            }
        });
        $("#resourceRulesPanel .resourceRule").droppable({
            containment: ".resourceRule",
            tolerance: "touch",
            accept: ".toolboxItem",
            greedy: true,
            drop: function (e, ui) {
                droppedElement = ui.helper.clone();
                droppedElement.removeClass("toolboxItem");
                droppedElement.addClass("item");
                $(this).append(droppedElement);
                ruleContent = $(this);
                leftOffset = $("#tapestryWorkspace").offset().left - ruleContent.offset().left + 20;
                topOffset = $("#tapestryWorkspace").offset().top - ruleContent.offset().top;
                droppedElement.offset({ left: droppedElement.offset().left + leftOffset, top: droppedElement.offset().top + topOffset });
                ui.helper.remove();
                AddToJsPlumb(droppedElement);
                ChangedSinceLastSave = true;
            }
        });
        $("#resourceRulesPanel .resourceRule").resizable({
            start: function (event, ui) {
                rule = $(this);
                contentsWidth = 120;
                contentsHeight = 40;
                rule.find(".item").each(function (index, element) {
                    rightEdge = $(element).position().left + $(element).width();
                    if (rightEdge > contentsWidth)
                        contentsWidth = rightEdge;
                    bottomEdge = $(element).position().top + $(element).height();
                    if (bottomEdge > contentsHeight)
                        contentsHeight = bottomEdge;
                });
                rule.css("min-width", contentsWidth + 40);
                rule.css("min-height", contentsHeight + 20);

                limits = CheckRuleResizeLimits(rule, true);
                rule.css("max-width", limits.horizontal - 10);
                rule.css("max-height", limits.vertical - 10);
            },
            resize: function (event, ui) {
                rule = $(this);
                limits = CheckRuleResizeLimits(rule, true);
                rule.css("max-width", limits.horizontal - 10);
                rule.css("max-height", limits.vertical - 10);
            },
            stop: function (event, ui) {
                instance = $(this).data("jsPlumbInstance");
                instance.recalculateOffsets();
                instance.repaintEverything();
                ChangedSinceLastSave = true;
            }
        });

        // Workflow rules
        $("#workflowRulesPanel .workflowRule").draggable({
            containment: "parent",
            handle: ".workflowRuleHeader",
            revert: function (event, ui) {
                return ($(this).collision("#workflowRulesPanel .workflowRule").length > 1);
            },
            stop: function (event, ui) {
                ChangedSinceLastSave = true;
            }
        });
        $(".swimlaneRolesArea").droppable({
            tolerance: "touch",
            accept: ".toolboxItem.roleItem",
            greedy: true,
            drop: function (e, ui) {
                droppedElement = ui.helper.clone();
                $(this).find(".rolePlaceholder, .roleItem").remove();
                $(this).append($('<div class="roleItem">' + droppedElement.text() + '</div>'));
                ui.helper.remove();
                ChangedSinceLastSave = true;
            }
        });
        $(".swimlaneContentArea").droppable({
            containment: ".swimlaneContentArea",
            tolerance: "touch",
            accept: ".toolboxSymbol, .toolboxItem",
            greedy: false,
            drop: function (e, ui) {
                droppedElement = ui.helper.clone();
                if (droppedElement.hasClass("roleItem")) {
                    ui.draggable.draggable("option", "revert", true);
                    return false;
                }
                $(this).append(droppedElement);
                ruleContent = $(this);
                if (droppedElement.hasClass("toolboxSymbol")) {
                    droppedElement.removeClass("toolboxSymbol ui-draggable ui-draggable-dragging");
                    droppedElement.addClass("symbol");
                    leftOffset = $("#tapestryWorkspace").offset().left - ruleContent.offset().left;
                    topOffset = $("#tapestryWorkspace").offset().top - ruleContent.offset().top;
                }
                else {
                    droppedElement.removeClass("toolboxItem");
                    droppedElement.addClass("item");
                    leftOffset = $("#tapestryWorkspace").offset().left - ruleContent.offset().left + 38;
                    topOffset = $("#tapestryWorkspace").offset().top - ruleContent.offset().top - 18;
                }
                droppedElement.offset({ left: droppedElement.offset().left + leftOffset, top: droppedElement.offset().top + topOffset });
                ui.helper.remove();
                AddToJsPlumb(droppedElement);
                ChangedSinceLastSave = true;
            }
        });
        $("#workflowRulesPanel .workflowRule").resizable({
            start: function (event, ui) {
                rule = $(this);
                contentsWidth = 120;
                contentsHeight = 40;
                rule.find(".item").each(function (index, element) {
                    rightEdge = $(element).position().left + $(element).width();
                    if (rightEdge > contentsWidth)
                        contentsWidth = rightEdge;
                    bottomEdge = $(element).position().top + $(element).height();
                    if (bottomEdge > contentsHeight)
                        contentsHeight = bottomEdge;
                });
                rule.css("min-width", contentsWidth + 40);
                rule.css("min-height", contentsHeight + 20);

                limits = CheckRuleResizeLimits(rule, false);
                rule.css("max-width", limits.horizontal - 10);
                rule.css("max-height", limits.vertical - 10);
            },
            resize: function (event, ui) {
                rule = $(this);
                instance = rule.data("jsPlumbInstance");
                instance.recalculateOffsets();
                instance.repaintEverything();
                limits = CheckRuleResizeLimits(rule, false);
                rule.css("max-width", limits.horizontal - 10);
                rule.css("max-height", limits.vertical - 10);
            },
            stop: function (event, ui) {
                ChangedSinceLastSave = true;
            }
        });
    }
});

var ZoomFactor = 1.0;
var ChangedSinceLastSave = false, dragModeActive = false;
var lastLibId = 1000;
$(function () {
    if (CurrentModuleIs("tapestryModule")) {
        RecalculateToolboxHeight();
        LoadBlock();

        // Buttons and UI effects
        $("#btnClear").on("click", function () {
            $("#resourceRulesPanel .resourceRule").remove();
            $("#workflowRulesPanel .workflowRule").remove();
            ChangedSinceLastSave = true;
        });
        $("#btnSave").on("click", function () {
            saveDialog.dialog("open");
        });
        $("#btnLoad").on("click", function () {
            if (ChangedSinceLastSave)
                confirmed = confirm("Máte neuložené změny, opravdu si přejete tyto změny zahodit?");
            else
                confirmed = true;
            if (confirmed) {
                LoadBlock();
            }
        });
        $("#btnHistory").on("click", function () {
            historyDialog.dialog("open");
        });
        $("#btnOverview").on("click", function () {
            if (ChangedSinceLastSave)
                confirmed = confirm("Máte neuložené změny, opravdu si přejete opustit blok?");
            else
                confirmed = true;
            if (confirmed) {
                ChangedSinceLastSave = false;
                openMetablockForm = $("#openMetablockForm");
                openMetablockForm.find("input[name='metablockId']").val($("#parentMetablockId").val());
                openMetablockForm.submit();
            }
        });
        window.onbeforeunload = function () {
            if (ChangedSinceLastSave) {
                pageSpinner.hide();
                return "Máte neuložené změny, opravdu si přejete opustit blok?";
            }
        };
        $("#btnOpenTableConditions").on("click", function () {
            $("#conditions-dialog").dialog("open");
        });
        $(".toolboxCategoryHeader_Symbols").on("click", function () {
            $(this).toggleClass("hiddenCategory");
            $(".symbolToolboxSpace").slideToggle();
        });
        $(".toolboxCategoryHeader_Actions").on("click", function () {
            if($(".toolboxLi_Actions").length > 0) {
                $(this).toggleClass("hiddenCategory");
                $(".toolboxLi_Actions").slideToggle();
            }
            else
                $(this).removeClass("hiddenCategory");
        });
        $(".toolboxCategoryHeader_Attributes").on("click", function () {
            if ($(".toolboxLi_Attributes").length > 0) {
                $(this).toggleClass("hiddenCategory");
                $(".toolboxLi_Attributes").slideToggle();
            }
            else
                $(this).removeClass("hiddenCategory");
        });
        $(".toolboxCategoryHeader_UI").on("click", function () {
            if ($(".toolboxLi_UI").length > 0) {
                $(this).toggleClass("hiddenCategory");
                $(".toolboxLi_UI").slideToggle();
            }
            else
                $(this).removeClass("hiddenCategory");
        });
        $(".toolboxCategoryHeader_Roles").on("click", function () {
            if ($(".toolboxLi_Roles").length > 0) {
                $(this).toggleClass("hiddenCategory");
                $(".toolboxLi_Roles").slideToggle();
            }
            else
                $(this).removeClass("hiddenCategory");
        });
        $(".toolboxCategoryHeader_States").on("click", function () {
            if ($(".toolboxLi_States").length > 0) {
                $(this).toggleClass("hiddenCategory");
                $(".toolboxLi_States").slideToggle();
            }
            else
                $(this).removeClass("hiddenCategory");
        });
        $(".toolboxCategoryHeader_Targets").on("click", function () {
            if ($(".toolboxLi_Targets").length > 0) {
                $(this).toggleClass("hiddenCategory");
                $(".toolboxLi_Targets").slideToggle();
            }
            else
                $(this).removeClass("hiddenCategory");
        });
        $(".toolboxCategoryHeader_Templates").on("click", function () {
            if ($(".toolboxLi_Templates").length > 0) {
                $(this).toggleClass("hiddenCategory");
                $(".toolboxLi_Templates").slideToggle();
            }
            else
                $(this).removeClass("hiddenCategory");
        });
        $(".toolboxCategoryHeader_Integrations").on("click", function () {
            if ($(".toolboxLi_Integrations").length > 0) {
                $(this).toggleClass("hiddenCategory");
                $(".toolboxLi_Integrations").slideToggle();
            }
            else
                $(this).removeClass("hiddenCategory");
        });
        $("#blockHeaderBlockName").on("click", function () {
            renameBlockDialog.dialog("open");
        });
        $("#blockHeaderDbResCount").on("click", function () {
            chooseTablesDialog.dialog("open");
        });
        $("#blockHeaderScreenCount").on("click", function () {
            chooseScreensDialog.dialog("open");
        });
        $("#blockHeaderRolesCount").on("click", function () {
            chooseWhitelistRolesDialog.dialog("open");
        });
        $(window).scroll(function () {
            var leftBar = $("#tapestryLeftBar");
            var scrollTop = $(window).scrollTop();
            var lowerPanelTop = $("#lowerPanel").offset().top;
            var overlay = $("#lowerPanelSpinnerOverlay");
            var topBarHeight = $("#topBar").height() + $("#appNotificationArea").height();

            overlay.css({right: 0, width: 'auto'});
            if (scrollTop > lowerPanelTop - topBarHeight) {
                leftBar.css({ top:topBarHeight, left: 225, position: "fixed" });
                overlay.css({ top:topBarHeight, left: 225, position: "fixed" });
            } else {
                leftBar.css({ top:0, left: 0, position: "absolute" });
                overlay.css({ top:0, left: 0, position: "absolute" });
            }
            RecalculateToolboxHeight();
        });
        $(window).resize(function () {
            RecalculateToolboxHeight();
        });
        $(".toolboxItem, .toolboxSymbol").draggable({
            helper: "clone",
            appendTo: '#tapestryWorkspace',
            containment: 'window',
            tolerance: "fit",
            revert: true,
            scroll: true,
            start: function () {
                dragModeActive = true;
            }
        });
        $("#hideTapestryTooboxIcon").on("click", function () {
            $("#tapestryLeftBar").hide();
            $("#tapestryLeftBarMinimized").show();
            $("#tapestryWorkspace").css("left", 32);
            RecalculateToolboxHeight();
        });
        $("#showTapestryTooboxIcon").on("click", function () {
            $("#tapestryLeftBar").show();
            $("#tapestryLeftBarMinimized").hide();
            $("#tapestryWorkspace").css("left", 236);
            RecalculateToolboxHeight();
        });

        // Add rules
        $("#btnAddResRule").on("click", function () {
            ChangedSinceLastSave = true;
            rightmostRuleEdge = 0;
            $("#resourceRulesPanel .resourceRule").each(function (index, element) {
                edge = $(element).position().left + $(element).width() + $("#resourceRulesPanel .scrollContainer").scrollLeft();
                if (edge > rightmostRuleEdge)
                    rightmostRuleEdge = edge;
            });
            newRule = $('<div class="rule resourceRule" style="width: 350px; height: 60px; left: ' + (rightmostRuleEdge + 10) + 'px; top: 10px;"></div>');
            $("#resourceRulesPanel .scrollArea").append(newRule);
            newRule.draggable({
                containment: "parent",
                revert: function (event, ui) {
                    return ($(this).collision("#resourceRulesPanel .resourceRule").length > 1);
                },
                stop: function (event, ui) {
                    ChangedSinceLastSave = true;
                }
            });
            newRule.resizable({
                start: function (event, ui) {
                    rule = $(this);
                    contentsWidth = 120;
                    contentsHeight = 40;
                    rule.find(".item").each(function (index, element) {
                        rightEdge = $(element).position().left + $(element).width();
                        if (rightEdge > contentsWidth)
                            contentsWidth = rightEdge;
                        bottomEdge = $(element).position().top + $(element).height();
                        if (bottomEdge > contentsHeight)
                            contentsHeight = bottomEdge;
                    });
                    rule.css("min-width", contentsWidth + 40);
                    rule.css("min-height", contentsHeight + 20);

                    limits = CheckRuleResizeLimits(rule, true);
                    rule.css("max-width", limits.horizontal - 10);
                    rule.css("max-height", limits.vertical - 10);
                },
                resize: function (event, ui) {
                    rule = $(this);
                    limits = CheckRuleResizeLimits(rule, true);
                    rule.css("max-width", limits.horizontal - 10);
                    rule.css("max-height", limits.vertical - 10);
                },
                stop: function (event, ui) {
                    instance = $(this).data("jsPlumbInstance");
                    instance.recalculateOffsets();
                    instance.repaintEverything();
                    ChangedSinceLastSave = true;
                }
            });
            CreateJsPlumbInstanceForRule(newRule);
            newRule.droppable({
                containment: ".resourceRule",
                tolerance: "touch",
                accept: ".toolboxItem",
                greedy: true,
                drop: function (e, ui) {
                    if (dragModeActive) {
                        dragModeActive = false;
                        droppedElement = ui.helper.clone();
                        droppedElement.removeClass("toolboxItem");
                        droppedElement.addClass("item");
                        droppedElement.css({ width: "", height: "" });
                        $(this).append(droppedElement);
                        ruleContent = $(this);
                        leftOffset = $("#tapestryWorkspace").offset().left - ruleContent.offset().left + 20;
                        topOffset = $("#tapestryWorkspace").offset().top - ruleContent.offset().top;
                        droppedElement.offset({ left: droppedElement.offset().left + leftOffset, top: droppedElement.offset().top + topOffset });
                        ui.helper.remove();
                        AddToJsPlumb(droppedElement);
                        if (droppedElement.position().left + droppedElement.width() + 35 > ruleContent.width()) {
                            droppedElement.css("left", ruleContent.width() - droppedElement.width() - 40);
                            instance = ruleContent.data("jsPlumbInstance");
                            instance.repaintEverything();
                        }
                        if (droppedElement.position().top + droppedElement.height() + 5 > ruleContent.height()) {
                            console.log("matched");
                            droppedElement.css("top", ruleContent.height() - droppedElement.height() - 15);
                            instance = ruleContent.data("jsPlumbInstance");
                            instance.repaintEverything();
                        }
                        ChangedSinceLastSave = true;
                    }
                }
            });
        });
        $("#btnAddWfRule").on("click", function () {
            ChangedSinceLastSave = true;
            lowestRuleBottom = 0;
            highestRuleNumber = 0;
            $("#workflowRulesPanel .workflowRule").each(function (index, element) {
                bottom = $(element).position().top + $(element).height() + $("#workflowRulesPanel .scrollContainer").scrollTop();
                if (bottom > lowestRuleBottom)
                    lowestRuleBottom = bottom;
                name = $(element).find(".workflowRuleHeader .verticalLabel").text();
                if (name.startsWith("Pravidlo ") && !isNaN(name.substring(9, name.length))) {
                    ruleNumber = parseInt(name.substring(9, name.length));
                    if (ruleNumber > highestRuleNumber)
                        highestRuleNumber = ruleNumber;
                }
            });
            newRule = $('<div class="rule workflowRule" style="width: 766px; height: 180px; left: 40px; top: ' + (lowestRuleBottom + 20) + 'px;"><div class="workflowRuleHeader"><div class="verticalLabel" style="margin-top: 0px;">Pravidlo ' + (highestRuleNumber + 1) + '</div>'
                + '</div><div class="swimlaneArea"><div class="swimlane" style="height: 100%;"><div class="swimlaneRolesArea"><div class="roleItemContainer"></div><div class="rolePlaceholder"><div class="rolePlaceholderLabel">Pokud chcete specifikovat roli<br />'
                + 'přetáhněte ji do této oblasti</div></div></div><div class="swimlaneContentArea"></div></div>'
                + '</div></div>');
            $("#workflowRulesPanel .scrollArea").append(newRule);
            newRule.draggable({
                containment: "parent",
                handle: ".workflowRuleHeader",
                revert: function (event, ui) {
                    return ($(this).collision("#workflowRulesPanel .workflowRule").length > 1);
                },
                stop: function (event, ui) {
                    ChangedSinceLastSave = true;
                }
            });
            newRule.resizable({
                start: function (event, ui) {
                    rule = $(this);
                    contentsWidth = 120;
                    contentsHeight = 40;
                    rule.find(".item").each(function (index, element) {
                        rightEdge = $(element).position().left + $(element).width();
                        if (rightEdge > contentsWidth)
                            contentsWidth = rightEdge;
                        bottomEdge = $(element).position().top + $(element).height();
                        if (bottomEdge > contentsHeight)
                            contentsHeight = bottomEdge;
                    });
                    rule.css("min-width", contentsWidth + 40);
                    rule.css("min-height", contentsHeight + 20);

                    limits = CheckRuleResizeLimits(rule, false);
                    rule.css("max-width", limits.horizontal - 10);
                    rule.css("max-height", limits.vertical - 10);
                },
                resize: function (event, ui) {
                    rule = $(this);
                    instance = rule.data("jsPlumbInstance");
                    instance.recalculateOffsets();
                    instance.repaintEverything();
                    limits = CheckRuleResizeLimits(rule, false);
                    rule.css("max-width", limits.horizontal - 10);
                    rule.css("max-height", limits.vertical - 10);
                },
                stop: function (event, ui) {
                    ChangedSinceLastSave = true;
                }
            });
            CreateJsPlumbInstanceForRule(newRule);
            newRule.find(".swimlaneRolesArea").droppable({
                containment: ".swimlaneContentArea",
                tolerance: "touch",
                accept: ".toolboxItem.roleItem",
                greedy: true,
                drop: function (e, ui) {
                    if (dragModeActive) {
                        dragModeActive = false;
                        roleExists = false;
                        $(this).find(".roleItem").each(function (index, element) {
                            if ($(element).text() == ui.helper.text())
                                roleExists = true;
                        });
                        if (!roleExists) {
                            droppedElement = ui.helper.clone();
                            $(this).find(".rolePlaceholder").remove();
                            $(this).find(".roleItemContainer").append($('<div class="roleItem">' + droppedElement.text() + '</div>'));
                            ui.helper.remove();
                            ChangedSinceLastSave = true;
                        }
                    }
                }
            });
            newRule.find(".swimlaneContentArea").droppable({
                containment: ".swimlaneContentArea",
                tolerance: "touch",
                accept: ".toolboxSymbol, .toolboxItem",
                greedy: false,
                drop: function (e, ui) {
                    if (dragModeActive) {
                        dragModeActive = false;
                        droppedElement = ui.helper.clone();
                        if (droppedElement.hasClass("roleItem")) {
                            ui.draggable.draggable("option", "revert", true);
                            return false;
                        }
                        ruleContent = $(this);
                        ruleContent.append(droppedElement);
                        if (droppedElement.hasClass("toolboxSymbol")) {
                            droppedElement.removeClass("toolboxSymbol ui-draggable ui-draggable-dragging");
                            droppedElement.addClass("symbol");
                            droppedElement.css({ height: "" });
                            leftOffset = $("#tapestryWorkspace").offset().left - ruleContent.offset().left;
                            topOffset = $("#tapestryWorkspace").offset().top - ruleContent.offset().top;
                        }
                        else {
                            droppedElement.removeClass("toolboxItem");
                            droppedElement.addClass("item");
                            droppedElement.css({ width: "", height: "" });
                            leftOffset = $("#tapestryWorkspace").offset().left - ruleContent.offset().left + 38;
                            topOffset = $("#tapestryWorkspace").offset().top - ruleContent.offset().top - 18;
                        }
                        droppedElement.offset({ left: droppedElement.offset().left + leftOffset, top: droppedElement.offset().top + topOffset });
                        ui.helper.remove();
                        AddToJsPlumb(droppedElement);
                        if (droppedElement.position().top + droppedElement.height() + 10 > ruleContent.height()) {
                            console.log("matched");
                            droppedElement.css("top", ruleContent.height() - droppedElement.height() - 20);
                            instance = ruleContent.parents(".workflowRule").data("jsPlumbInstance");
                            instance.repaintEverything();
                        }
                        ChangedSinceLastSave = true;
                    }
                }
            });
        });
        $(document).on("click", ".libraryItem", function () {
            currentLibraryItem = $(this);
            libId = currentLibraryItem.attr("libId");
            libType = currentLibraryItem.attr("libType");
            if (libId) {
                if (currentLibraryItem.hasClass("highlighted")) {
                    $('.tapestryToolbox .toolboxLi[libId="' + libId + '"]').remove();
                }
                else {
                    newToolboxLi = null;
                    if (libType == "action") {
                        newToolboxLi = $('<li libId="' + libId + '" class="toolboxLi toolboxLi_Actions"><div class="toolboxItem actionItem" actionId="' + currentLibraryItem.attr("actionId") + '"><span class="itemLabel">'
                            + currentLibraryItem.text() + '</span></div></li>');
                        $(".tapestryToolbox .toolboxCategoryHeader_Attributes").before(newToolboxLi);
                        if ($(".tapestryToolbox .toolboxCategoryHeader_Actions").hasClass("hiddenCategory"))
                            newToolboxLi.hide();
                    }
                    else if (libType == "column-attribute") {
                        newToolboxLi = $('<li libId="' + libId + '" class="toolboxLi toolboxLi_Attributes"><div class="toolboxItem attributeItem tableAttribute" tableName="' + currentLibraryItem.attr("tableName") + '" columnName="' + currentLibraryItem.attr("columnName") + '"><span class="itemLabel">'
                            + currentLibraryItem.text() + '</span></div></li>');
                        $(".tapestryToolbox .toolboxCategoryHeader_UI").before(newToolboxLi);
                        if ($(".tapestryToolbox .toolboxCategoryHeader_Attributes").hasClass("hiddenCategory"))
                            newToolboxLi.hide();
                    }
                    else if (libType == "table-attribute") {
                        newToolboxLi = $('<li libId="' + libId + '" class="toolboxLi toolboxLi_Attributes"><div class="toolboxItem attributeItem tableAttribute" tableName="' + currentLibraryItem.attr("tableName") + '"><span class="itemLabel">'
                            + currentLibraryItem.text() + '</span></div></li>');
                        $(".tapestryToolbox .toolboxCategoryHeader_UI").before(newToolboxLi);
                        if ($(".tapestryToolbox .toolboxCategoryHeader_Attributes").hasClass("hiddenCategory"))
                            newToolboxLi.hide();
                    }
                    else if (libType == "view-attribute") {
                        newToolboxLi = $('<li libId="' + libId + '" class="toolboxLi toolboxLi_Attributes"><div class="toolboxItem attributeItem viewAttribute" tableName="' + currentLibraryItem.attr("tableName") + '"><span class="itemLabel">'
                            + currentLibraryItem.text() + '</span></div></li>');
                        $(".tapestryToolbox .toolboxCategoryHeader_UI").before(newToolboxLi);
                        if ($(".tapestryToolbox .toolboxCategoryHeader_Attributes").hasClass("hiddenCategory"))
                            newToolboxLi.hide();
                    }
                    else if (libType == "ui") {
                        newToolboxLi = $('<li libId="' + libId + '" class="toolboxLi toolboxLi_UI"><div class="toolboxItem uiItem" pageId="' + currentLibraryItem.attr("pageId") + '" componentName="' + currentLibraryItem.attr("componentName") + '"><span class="itemLabel">'
                            + currentLibraryItem.text() + '</span></div></li>');
                        $(".tapestryToolbox .toolboxCategoryHeader_Roles").before(newToolboxLi);
                        if ($(".tapestryToolbox .toolboxCategoryHeader_UI").hasClass("hiddenCategory"))
                            newToolboxLi.hide();
                    }
                    else if (libType == "page-ui") {
                        newToolboxLi = $('<li libId="' + libId + '" class="toolboxLi toolboxLi_UI"><div class="toolboxItem uiItem pageUi" pageId="' + currentLibraryItem.attr("pageId") + '"><span class="itemLabel">'
                            + currentLibraryItem.text() + '</span></div></li>');
                        $(".tapestryToolbox .toolboxCategoryHeader_Roles").before(newToolboxLi);
                        if ($(".tapestryToolbox .toolboxCategoryHeader_UI").hasClass("hiddenCategory"))
                            newToolboxLi.hide();
                    }
                    else if (libType == "role") {
                        newToolboxLi = $('<li libId="' + libId + '" class="toolboxLi toolboxLi_Roles"><div class="toolboxItem roleItem"><span class="itemLabel">'
                            + currentLibraryItem.text() + '</span></div></li>');
                        $(".tapestryToolbox .toolboxCategoryHeader_States").before(newToolboxLi);
                        if ($(".tapestryToolbox .toolboxCategoryHeader_Roles").hasClass("hiddenCategory"))
                            newToolboxLi.hide();
                    }
                    else if (libType == "state") {
                        newToolboxLi = $('<li libId="' + libId + '" class="toolboxLi toolboxLi_States"><div class="toolboxItem stateItem" stateId="' + currentLibraryItem.attr("stateId") + '"><span class="itemLabel">'
                            + currentLibraryItem.text() + '</span></div></li>');
                        $(".tapestryToolbox .toolboxCategoryHeader_Targets").before(newToolboxLi);
                        if ($(".tapestryToolbox .toolboxCategoryHeader_States").hasClass("hiddenCategory"))
                            newToolboxLi.hide();
                    }
                    else if (libType == "target") {
                        newToolboxLi = $('<li libId="' + libId + '" class="toolboxLi toolboxLi_Targets"><div class="toolboxItem targetItem" targetId="' + currentLibraryItem.attr("targetId") + '"><span class="itemLabel">'
                            + currentLibraryItem.text() + '</span></div></li>');
                        $(".tapestryToolbox .toolboxCategoryHeader_Templates").before(newToolboxLi);
                        if ($(".tapestryToolbox .toolboxCategoryHeader_Targets").hasClass("hiddenCategory"))
                            newToolboxLi.hide();
                    }
                    else if (libType == "template") {
                        newToolboxLi = $('<li libId="' + libId + '" class="toolboxLi toolboxLi_Templates"><div class="toolboxItem templateItem"><span class="itemLabel">'
                            + currentLibraryItem.text() + '</span></div></li>')
                        $(".tapestryToolbox .toolboxCategoryHeader_Integrations").before(newToolboxLi);
                        if ($(".tapestryToolbox .toolboxCategoryHeader_Templates").hasClass("hiddenCategory"))
                            newToolboxLi.hide();
                    }
                    else if (["ldap", "ws", "smtp", "webdav"].indexOf(libType) != -1) {
                        newToolboxLi = $('<li libId="' + libId + '" class="toolboxLi toolboxLi_Integrations"><div class="toolboxItem integrationItem"><span class="itemLabel">'
                            + currentLibraryItem.text() + '</span></div></li>')
                        $(".tapestryToolbox").append(newToolboxLi);
                        if ($(".tapestryToolbox .toolboxCategoryHeader_Integrations").hasClass("hiddenCategory"))
                            newToolboxLi.hide();
                    }
                    if (newToolboxLi)
                        newToolboxLi.find(".toolboxItem").draggable({
                            helper: "clone",
                            appendTo: '#tapestryWorkspace',
                            containment: 'window',
                            tolerance: "fit",
                            revert: true,
                            scroll: true,
                            start: function () {
                                dragModeActive = true;
                            }
                        });
                }
            }
            $(this).toggleClass("highlighted");
        });
    }
});

var CurrentRule, CurrentItem, AssociatedPageIds = [], AssociatedTableName = [], AssociatedTableIds = [], CurrentTableColumnArray = [], RoleWhitelist = [], ModelTableName;

$(function () {
    if (CurrentModuleIs("tapestryModule")) {
        renameBlockDialog = $("#rename-block-dialog").dialog({
            autoOpen: false,
            width: 400,
            height: 190,
            buttons: {
                "Save": function () {
                    renameBlockDialog_SubmitData();
                },
                Cancel: function () {
                    renameBlockDialog.dialog("close");
                }
            },
            create: function () {
                $(this).keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        renameBlockDialog_SubmitData();
                        return false;
                    }
                })
            },
            open: function () {
                renameBlockDialog.find("#block-name").val($("#blockHeaderBlockName").text());
            }
        });
        function renameBlockDialog_SubmitData() {
            renameBlockDialog.dialog("close");
            $("#blockHeaderBlockName").text(renameBlockDialog.find("#block-name").val());
            ChangedSinceLastSave = true;
        }
        chooseTableDialog = $("#choose-table-dialog").dialog({
            autoOpen: false,
            width: 450,
            height: 500,
            buttons: {
                "Change": function () {
                    chooseTableDialog_SubmitData();
                },
                Cancel: function () {
                    chooseTableDialog.dialog("close");
                }
            },
            open: function (event, ui) {
                $(this).find("#choice-table:first tbody:nth-child(2) tr").remove();
                tbody = $(this).find("#choice-table tbody:nth-child(2)");
                for (i = 1; i <= 5; i++)
                    tbody.append($('<tr class="tableNameRow formRow"><td>' + 'Table' + i + '</td></tr>'));
                $(document).on("click", "tr.tableNameRow", function (event) {
                    chooseTableDialog.find("#choice-table tbody:nth-child(2) tr").removeClass("highlightedRow");
                    $(this).addClass("highlightedRow");
                });
            }
        });
        function chooseTableDialog_SubmitData() {
            somethingWasAdded = false;
            selectedRow = chooseTableDialog.find("#choice-table:first tbody:nth-child(2) tr.highlightedRow");
            if (selectedRow.length) {
                chooseTableDialog.dialog("close");
                $("#headerTableName").text(selectedRow.find("td").text());
                ChangedSinceLastSave = true;
            }
            else
                alert("No table selected");
        }
        chooseEmailTemplateDialog = $("#choose-email-template-dialog").dialog({
            autoOpen: false,
            width: 450,
            height: 500,
            buttons: {
                "Choose": function () {
                    chooseEmailTemplateDialog_SubmitData();
                },
                Cancel: function () {
                    chooseEmailTemplateDialog.dialog("close");
                }
            },
            open: function (event, ui) {
                $(this).find("#choice-template:first tbody:nth-child(2) tr").remove();
                tbody = $(this).find("#choice-template tbody:nth-child(2)");
                for (i = 1; i <= 5; i++)
                    tbody.append($('<tr class="emailTemplateRow formRow" templateId="' + i + '"><td>' + 'Email template ' + i + '</td></tr>'));
                if (CurrentItem.data("emailTemplate"))
                    tbody.find('tr[templateId="' + CurrentItem.data("emailTemplate") + '"]').addClass("highlightedRow");
                $(document).on("click", "tr.emailTemplateRow", function (event) {
                    chooseEmailTemplateDialog.find("#choice-template tbody:nth-child(2) tr").removeClass("highlightedRow");
                    $(this).addClass("highlightedRow");
                });
            }
        });
        function chooseEmailTemplateDialog_SubmitData() {
            selectedRow = chooseEmailTemplateDialog.find("#choice-template:first tbody:nth-child(2) tr.highlightedRow");
            if (selectedRow.length) {
                CurrentItem.data("emailTemplate", selectedRow.attr("templateId"));
                chooseEmailTemplateDialog.dialog("close");
                ChangedSinceLastSave = true;
            }
            else
                alert("No template selected");
        }
        
        renameRuleDialog = $("#rename-rule-dialog").dialog({
            autoOpen: false,
            width: 400,
            height: 190,
            buttons: {
                "Save": function () {
                    renameRuleDialog_SubmitData();
                },
                Cancel: function () {
                    renameRuleDialog.dialog("close");
                }
            },
            create: function () {
                $(this).keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        renameRuleDialog_SubmitData();
                        return false;
                    }
                })
            },
            open: function () {
                renameRuleDialog.find("#rule-name").val(CurrentRule.find(".workflowRuleHeader .verticalLabel").text());
            }
        });
        function renameRuleDialog_SubmitData() {
            renameRuleDialog.dialog("close");
            CurrentRule.find(".workflowRuleHeader .verticalLabel").text(renameRuleDialog.find("#rule-name").val());
            ChangedSinceLastSave = true;
        }
        historyDialog = $("#history-dialog").dialog({
            autoOpen: false,
            width: 700,
            height: 540,
            buttons: {
                "Load": function () {
                    historyDialog_SubmitData();
                },
                Cancel: function () {
                    historyDialog.dialog("close");
                }
            },
            open: function (event, ui) {
                historyDialog.find("#commit-table:first tbody:nth-child(2) tr").remove();
                historyDialog.find(" .spinner-2").show();
                historyDialog.data("selectedCommitId", null);
                appId = $("#currentAppId").val();
                blockId = $("#currentBlockId").val();
                $.ajax({
                    type: "GET",
                    url: "/api/tapestry/apps/" + appId + "/blocks/" + blockId + "/commits",
                    dataType: "json",
                    success: function (data) {
                        tbody = historyDialog.find("#commit-table tbody:nth-child(2)");
                        commitIdArray = [];

                        // Fill in the history rows
                        for (i = 0; i < data.length; i++) {
                            commitIdArray.push(data[i].Id);
                            if (data[i].CommitMessage != null)
                                tbody.append($('<tr class="commitRow"><td>' + data[i].TimeString
                                    + '</td><td>' + data[i].CommitMessage + '</td></tr>'));
                            else
                                tbody.append($('<tr class="commitRow"><td>' + data[i].TimeString
                                    + '</td><td style="color: darkgrey;">(no message)</td></tr>'));
                        }

                        // Highlight the selected row
                        $(document).on('click', 'tr.commitRow', function (event) {
                            historyDialog.find("#commit-table tbody:nth-child(2) tr").removeClass("highlightedRow");
                            $(this).addClass("highlightedRow");
                            var rowIndex = $(this).index();
                            historyDialog.data("selectedCommitId", commitIdArray[rowIndex]);
                        });

                        historyDialog.find(".spinner-2").hide();
                    }
                });
            }
        });
        function historyDialog_SubmitData() {
            if (historyDialog.data("selectedCommitId")) {
                historyDialog.dialog("close");
                if (ChangedSinceLastSave)
                    confirmed = confirm("Máte neuložené změny, opravdu si přejete tyto změny zahodit?");
                else
                    confirmed = true;
                if (confirmed) {
                    LoadBlock(historyDialog.data("selectedCommitId"));
                }
            }
            else
                alert("Please select a commit");
        }
        saveDialog = $("#save-dialog").dialog({
            autoOpen: false,
            width: 400,
            height: 190,
            buttons: {
                "Save": function () {
                    saveDialog_SubmitData();
                },
                Cancel: function () {
                    saveDialog.dialog("close");
                }
            },
            create: function () {
                $(this).keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        saveDialog_SubmitData();
                        return false;
                    }
                })
            },
            open: function () {
                saveDialog.find("#message").val("");
            }
        });
        function saveDialog_SubmitData() {
            saveDialog.dialog("close");
            SaveBlock(saveDialog.find("#message").val());
        }
        chooseScreensDialog = $("#choose-screens-dialog").dialog({
            autoOpen: false,
            width: 450,
            height: 550,
            buttons: {
                "Select": function () {
                    chooseScreensDialog_SubmitData();
                },
                Cancel: function () {
                    chooseScreensDialog.dialog("close");
                }
            },
            create: function () {
                $(document).on("click", "tr.actionRow", function (event) {
                    $(this).toggleClass("highlightedRow");
                });
            },
            open: function (event, ui) {
                chooseScreensDialog.find("#screen-table:first tbody:nth-child(2) tr").remove();
                chooseScreensDialog.find(".spinner-2").show();
                appId = $("#currentAppId").val();
                $.ajax({
                    type: "GET",
                    url: "/api/mozaic-editor/apps/" + appId + "/pages",
                    dataType: "json",
                    success: function (data) {
                        tbody = chooseScreensDialog.find("#screen-table tbody:nth-child(2)");
                        for (i = 0; i < data.length; i++) {
                            newScreenRow = $('<tr class="screenRow" pageId="' + data[i].Id + '"><td>' + data[i].Name + '</td></tr>');
                            if (AssociatedPageIds.indexOf(data[i].Id) != -1)
                                newScreenRow.addClass("highlightedRow");
                            tbody.append(newScreenRow);
                        }
                        $("#screen-table .screenRow").on("click", function () {
                            $(this).toggleClass("highlightedRow");
                        });
                        chooseScreensDialog.find(".spinner-2").hide();
                    }
                });
            }
        });
        function chooseScreensDialog_SubmitData() {
            chooseScreensDialog.find("#screen-table:first tbody:nth-child(2) tr").hide();
            chooseScreensDialog.find(".spinner-2").show();
            somethingWasAdded = false;
            pageCount = 0;
            appId = $("#currentAppId").val();
            AssociatedPageIds = [];
            $("#libraryCategory-UI .libraryItem").remove();
            setTimeout(function () {
                chooseScreensDialog.find("#screen-table:first tbody:nth-child(2) tr").each(function (index, element) {
                    if ($(element).hasClass("highlightedRow")) {
                        pageCount++;
                        pageId = $(element).attr("pageId");
                        AssociatedPageIds.push(parseInt(pageId));
                        url = "/api/mozaic-editor/apps/" + appId + "/pages/" + pageId;
                        $.ajax({
                            type: "GET",
                            url: url,
                            dataType: "json",
                            async: false,
                            success: function (data) {
                                for (i = 0; i < data.Components.length; i++) {
                                    if (i == 0) {
                                        $("#libraryCategory-UI").append('<div libId="' + ++lastLibId + '" pageId="' + data.Id + '" libType="ui" class="libraryItem">Screen: '
                                            + data.Name + '</div>');
                                    }
                                    cData = data.Components[i];
                                    $("#libraryCategory-UI").append('<div libId="' + ++lastLibId + '" pageId="' + data.Id + '" componentName="' + data.Components[i].Name + '" libType="ui" class="libraryItem">'
                                    + cData.Name + '</div>');
                                    if (cData.Type == "data-table-with-actions") {
                                        $("#libraryCategory-UI").append('<div libId="' + ++lastLibId + '" pageId="' + data.Id + '" componentName="datatable_edit" libType="ui" class="libraryItem">'
                                            + cData.Name + '_EditAction</div>');
                                        $("#libraryCategory-UI").append('<div libId="' + ++lastLibId + '" pageId="' + data.Id + '" componentName="datatable_detail" libType="ui" class="libraryItem">'
                                            + cData.Name + '_DetailsAction</div>');
                                        $("#libraryCategory-UI").append('<div libId="' + ++lastLibId + '" pageId="' + data.Id + '" componentName="datatable_delete" libType="ui" class="libraryItem">'
                                            + cData.Name + '_DeleteAction</div>');
                                        $("#libraryCategory-UI").append('<div libId="' + ++lastLibId + '" pageId="' + data.Id + '" componentName="datatable_actionA" libType="ui" class="libraryItem">'
                                            + cData.Name + '_A_Action</div>');
                                        $("#libraryCategory-UI").append('<div libId="' + ++lastLibId + '" pageId="' + data.Id + '" componentName="datatable_actionB" libType="ui" class="libraryItem">'
                                            + cData.Name + '_B_Action</div>');
                                    }
                                    if (cData.ChildComponents) {
                                        for (j = 0; j < cData.ChildComponents.length; j++) {
                                            $("#libraryCategory-UI").append('<div libId="' + ++lastLibId + '" pageId="' + data.Id + '" componentName="' + cData.ChildComponents[j].Name + '" libType="ui" class="libraryItem">'
                                            + cData.ChildComponents[j].Name + '</div>');
                                        }
                                    }
                                }
                            }
                        });
                    }
                });
                $("#blockHeaderScreenCount").text(pageCount);
                chooseScreensDialog.find(".spinner-2").hide();
                chooseScreensDialog.dialog("close");
            }, 4);
        }
        tableAttributePropertiesDialog = $("#table-attribute-properties-dialog").dialog({
            autoOpen: false,
            width: 450,
            height: 500,
            buttons: {
                "Change": function () {
                    tableAttributePropertiesDialog_SubmitData();
                },
                Cancel: function () {
                    tableAttributePropertiesDialog.dialog("close");
                    CurrentItem.removeClass("activeItem");
                }
            },
            open: function (event, ui) {
                var formTable = tableAttributePropertiesDialog.find(".columnFilterTable tbody");
                formTable.find("tr").remove();
                $("#table-attribute-properties-dialog .spinner-2").show();
                $("#btnOpenTableConditions").hide();
                appId = $("#currentAppId").val();
                url = "/api/database/apps/" + appId + "/commits/latest",
                tableName = CurrentItem.attr("tableName");
                $.ajax({
                    type: "GET",
                    url: url,
                    dataType: "json",
                    success: function (data) {
                        CurrentTableColumnArray = [];
                        columnFilter = CurrentItem.data("columnFilter");
                        if (columnFilter == undefined)
                            columnFilter = [];
                        targetTable = data.Tables.filter(function (value, index, ar) {
                            return value.Name == tableName;
                        })[0];
                        if (targetTable == undefined)
                            alert("Požadovaná tabulka již není součástí schématu v Entitronu, nebo má nyní jiné Id.");
                        for (i = 0; i < targetTable.Columns.length; i++) {
                            newRow = $('<tr><td class="nameCell">' + targetTable.Columns[i].Name + '</td>'
                                + '<td><input type="checkbox" class="showColumnCheckbox"></input>Show</td></tr>');
                            formTable.append(newRow);
                            newRow.find(".showColumnCheckbox").prop("checked", columnFilter.indexOf(targetTable.Columns[i].Name) != -1);
                            CurrentTableColumnArray.push({ Id: targetTable.Columns[i].Id, Name: targetTable.Columns[i].Name, Type: targetTable.Columns[i].Type });
                        }
                        $("#btnOpenTableConditions").show();
                        $("#table-attribute-properties-dialog .spinner-2").hide();
                    }
                });
            }
        });
        function tableAttributePropertiesDialog_SubmitData() {
            columnFilter = [];
            formTable = tableAttributePropertiesDialog.find(".columnFilterTable .showColumnCheckbox").each(function (index, checkboxElement) {
                columnName = $(checkboxElement).parents("tr").find(".nameCell").text();
                if($(checkboxElement).is(":checked"))
                    columnFilter.push(columnName);
            });
            CurrentItem.data("columnFilter", columnFilter).removeClass("activeItem");;
            tableAttributePropertiesDialog.dialog("close");
        }
        uiitemPropertiesDialog = $("#uiItem-properties-dialog").dialog({
            autoOpen: false,
            width: 450,
            height: 180,
            buttons: {
                "Save": function () {
                    uiitemPropertiesDialog_SubmitData();
                },
                Cancel: function () {
                    uiitemPropertiesDialog.dialog("close");
                    CurrentItem.removeClass("activeItem");
                }
            },
            open: function (event, ui) {
                uiitemPropertiesDialog.find("#ajax-action").prop('checked', CurrentItem.data("isAjaxAction"));
            }
        });
        function uiitemPropertiesDialog_SubmitData() {
            CurrentItem.data("isAjaxAction", uiitemPropertiesDialog.find("#ajax-action").is(':checked'));
            uiitemPropertiesDialog.dialog("close");
            CurrentItem.removeClass("activeItem");
        }
        chooseTablesDialog = $("#choose-tables-dialog").dialog({
            autoOpen: false,
            width: 450,
            height: 550,
            buttons: {
                "Select": function () {
                    chooseTablesDialog_SubmitData();
                },
                Cancel: function () {
                    chooseTablesDialog.dialog("close");
                }
            },
            create: function () {
                $(document).on("click", "tr.tableRow", function (event) {
                    $(this).toggleClass("highlightedRow");
                });
            },
            open: function (event, ui) {
                chooseTablesDialog.find("#table-table:first tbody:nth-child(2) tr").remove();
                chooseTablesDialog.find(".spinner-2").show();
                appId = $("#currentAppId").val();
                url = "/api/database/apps/" + appId + "/commits/latest";
                $.ajax({
                    type: "GET",
                    url: url,
                    dataType: "json",
                    success: function (data) {
                        tbody = chooseTablesDialog.find("#table-table tbody:nth-child(2)");
                        for (i = 0; i < data.Tables.length; i++) {
                            newTableRow = $('<tr class="tableRow" tableId="' + data.Tables[i].Id + '"><td><span class="tableName">' + data.Tables[i].Name + '</span></td></tr>');
                            if (AssociatedTableName.indexOf(data.Tables[i].Name) != -1)
                                newTableRow.addClass("highlightedRow");
                            if (data.Tables[i].Name == ModelTableName)
                                newTableRow.find("td").append('<div class="modelMarker">Model</div>');
                            tbody.append(newTableRow);
                        }
                        for (i = 0; i < SystemTables.length; i++) {
                            newTableRow = $('<tr class="tableRow" tableId="' + SystemTables[i].Name + '"><td><span class="tableName">' + SystemTables[i].Name + '</span></td></tr>');
                            if (AssociatedTableName.indexOf(SystemTables[i].Name) != -1)
                                newTableRow.addClass("highlightedRow");
                            if (SystemTables[i].Name == ModelTableName)
                                newTableRow.find("td").append('<div class="modelMarker">Model</div>');
                            tbody.append(newTableRow);
                        }
                        chooseTablesDialog.find(".spinner-2").hide();
                    }
                });
            }
        });
        function chooseTablesDialog_SubmitData() {
            chooseTablesDialog.find("#table-table:first tbody:nth-child(2) tr").hide();
            chooseTablesDialog.find(".spinner-2").show();
            appId = $("#currentAppId").val();
            url = "/api/database/apps/" + appId + "/commits/latest";
            $.ajax({
                type: "GET",
                url: url,
                dataType: "json",
                success: function (data) {
                    $("#libraryCategory-Attributes .columnAttribute").remove();
                    somethingWasAdded = false;
                    tableCount = 0;
                    AssociatedTableIds = [];
                    AssociatedTableName = [];
                    chooseTablesDialog.find("#table-table:first tbody:nth-child(2) tr").each(function (index, element) {
                        if ($(element).hasClass("highlightedRow")) {
                            tableCount++;
                            tableId = $(element).attr("tableId");
                            tableName = $(element).find('td .tableName').text();
                            AssociatedTableIds.push(parseInt(tableId));
                            AssociatedTableName.push(tableName);
                            currentTable = data.Tables.filter(function (value) {
                                return value.Id == tableId;
                            })[0];
                            if (currentTable)
                                for (i = 0; i < currentTable.Columns.length; i++) {
                                    $("#libraryCategory-Attributes").append($('<div libId="' + ++lastLibId + '" libType="column-attribute" class="libraryItem columnAttribute" tableName="'
                                        + currentTable.Name + '" columnName="' + currentTable.Columns[i].Name + '">' + currentTable.Name + '.' + currentTable.Columns[i].Name + '</div>'));
                                }
                            systemTable = SystemTables.filter(function (value) {
                                return value.Name == tableName;
                            })[0];
                            if(systemTable)
                                for (i = 0; i < systemTable.Columns.length; i++) {
                                    $("#libraryCategory-Attributes").append($('<div libId="' + ++lastLibId + '" libType="column-attribute" class="libraryItem columnAttribute" tableName="'
                                        + systemTable.Name + '" columnName="' + systemTable.Columns[i] + '">' + systemTable.Name + '.' + systemTable.Columns[i] + '</div>'));
                                }
                        }
                    });
                    modelMarker = chooseTablesDialog.find("#table-table:first tbody:nth-child(2) .modelMarker");
                    if (modelMarker.length) {
                        ModelTableName = modelMarker.parents("td").find(".tableName").text();
                    }
                    $("#blockHeaderDbResCount").text(tableCount);
                    chooseTablesDialog.dialog("close");
                    chooseTablesDialog.find(".spinner-2").hide();
                }
            });
        }
        actionPropertiesDialog = $("#action-properties-dialog").dialog({
            autoOpen: false,
            width: 900,
            height: 200,
            buttons: {
                "Save": function () {
                    actionPropertiesDialog_SubmitData();
                },
                Cancel: function () {
                    actionPropertiesDialog.dialog("close");
                    CurrentItem.removeClass("activeItem");
                }
            },
            create: function () {
                $(this).keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        actionPropertiesDialog_SubmitData();
                        return false;
                    }
                })
            },
            open: function () {
                actionPropertiesDialog.find("#input-variables").val(CurrentItem.data("inputVariables"));
                actionPropertiesDialog.find("#output-variables").val(CurrentItem.data("outputVariables"));
            }
        });
        function actionPropertiesDialog_SubmitData() {
            CurrentItem.data("inputVariables", actionPropertiesDialog.find("#input-variables").val());
            CurrentItem.data("outputVariables", actionPropertiesDialog.find("#output-variables").val());
            actionPropertiesDialog.dialog("close");
        }
        labelPropertyDialog = $("#label-property-dialog").dialog({
            autoOpen: false,
            width: 900,
            height: 200,
            buttons: {
                "Save": function () {
                    labelPropertyDialog_SubmitData();
                },
                Cancel: function () {
                    labelPropertyDialog.dialog("close");
                    CurrentItem.removeClass("activeItem processedItem");
                }
            },
            open: function () {
                labelPropertyDialog.find("#label-input").val(CurrentItem.find(".itemLabel").text());
            }
        });
        function labelPropertyDialog_SubmitData() {
            CurrentItem.find(".itemLabel").text(labelPropertyDialog.find("#label-input").val());
            CurrentItem.removeClass("activeItem processedItem");
            labelPropertyDialog.dialog("close");
        }
        conditionsDialog = $("#conditions-dialog").dialog({
            autoOpen: false,
            width: 800,
            height: 560,
            buttons: {
                "Save": function () {
                    conditionsDialog_SubmitData();
                },
                Cancel: function () {
                    conditionsDialog.dialog("close");
                }
            },
            create: function () {
                $(this).keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        conditionsDialog_SubmitData();
                        return false;
                    }
                });
                $(this).find(".addAndConditionSetIcon").on("click", function () {
                    newConditionSet = $(ConditionSetTemplate);
                    newConditionSet.find(".conditionSetPrefix").text("AND a");
                    newConditionSet.find(".conditionTable").append($(ConditionTemplate))
                    LoadConditionColumns(newConditionSet);
                    conditionsDialog.find(".conditionSetArea").append(newConditionSet);
                    if (newConditionSet.index() == 0)
                        newConditionSet.find(".conditionSetPrefix").text("A");
                });
                $(this).find(".addOrConditionSetIcon").on("click", function () {
                    newConditionSet = $(ConditionSetTemplate);
                    newConditionSet.find(".conditionSetPrefix").text("OR a");
                    newConditionSet.find(".conditionTable").append($(ConditionTemplate))
                    LoadConditionColumns(newConditionSet);
                    conditionsDialog.find(".conditionSetArea").append(newConditionSet);
                    if (newConditionSet.index() == 0)
                        newConditionSet.find(".conditionSetPrefix").text("A");
                });
                $(this).on("click", ".addAndConditionIcon", function () {
                    newCondition = $(ConditionTemplate);
                    newCondition.find(".conditionOperator").text("and");
                    LoadConditionColumns(newCondition);
                    $(this).parents("tr").after(newCondition);
                });
                $(this).on("click", ".addOrConditionIcon", function () {
                    newCondition = $(ConditionTemplate);
                    newCondition.find(".conditionOperator").text("or");
                    LoadConditionColumns(newCondition);
                    $(this).parents("tr").after(newCondition);
                });
                $(this).on("click", ".removeConditionIcon", function () {
                    currentCondition = $(this).parents("tr");
                    if (currentCondition.index() == 0)
                        currentCondition.parents("table").find("tr:eq(1)").find(".conditionOperator").text("");
                    if (currentCondition.parents("table").find("tr").length == 1) {
                        if (currentCondition.parents(".conditionSet").index() == 0)
                            currentCondition.parents(".conditionSetArea").find(".conditionSet:eq(1)").find(".conditionSetPrefix").text("A");
                        currentCondition.parents(".conditionSet").remove();
                    }
                    else
                        currentCondition.remove();
                });
                $(this).on("click", ".removeConditionSetIcon", function () {
                    currentConditionSet = $(this).parents(".conditionSet");
                    if (currentConditionSet.index() == 0)
                        currentConditionSet.parents(".conditionSetArea").find(".conditionSet:eq(1)").find(".conditionSetPrefix").text("A");
                    currentConditionSet.remove();
                });
                $(this).on("change", ".conditionVariableCell select", function () {
                    currentCondition = $(this).parents("tr");
                    var optionSelected = $("option:selected", this);
                    varType = optionSelected.attr("varType");
                    currentCondition.find(".conditionOperatorCell select, .conditionValueCell select, .conditionValueCell input").remove();
                    switch(varType) {
                        case "bool":
                            currentCondition.find(".conditionValueCell").append($('<select><option selected="selected">true</option><<option>false</option></select>'));
                            currentCondition.find(".conditionOperatorCell").append($('<select><option selected="selected">==</option><option>!=</option></select>'));
                            break;
                        case "int":
                            currentCondition.find(".conditionValueCell").append($('<input type="number"></input>'));
                            currentCondition.find(".conditionOperatorCell").append($('<select><option selected="selected">==</option><option>!=</option><option>&gt;</option><option>&gt;=</option><option>&lt;</option><option>&lt;=</option>'));
                            break;
                        case "string":
                            currentCondition.find(".conditionValueCell").append($('<input type="text"></input>'));
                            currentCondition.find(".conditionOperatorCell").append($('<select><option selected="selected">==</option><option>!=</option><option>contains</option><option inputType="none">is empty</option><option inputType="none">is not empty</option></select>'));
                            break;
                        case "unknown":
                        default:
                            currentCondition.find(".conditionValueCell").append($('<input type="text"></input>'));
                            currentCondition.find(".conditionOperatorCell").append($('<select><option selected="selected">==</option><option>!=</option><option>&gt;</option><option>&gt;=</option><option>&lt;</option><option>&lt;=</option><option>contains</option><option inputType="none">is empty</option><option inputType="none">is not empty</option></select>'));
                    }
                });
                $(this).on("change", ".conditionOperatorCell select", function () {
                    currentCondition = $(this).parents("tr");
                    var optionSelected = $("option:selected", this);
                    inputType = optionSelected.attr("inputType");
                    if (inputType === "none")
                        currentCondition.find(".conditionValueCell input, .conditionValueCell select").hide();
                    else
                        currentCondition.find(".conditionValueCell input, .conditionValueCell select").show();
                });
            },
            open: function () {
                conditionSetArea = conditionsDialog.find(".conditionSetArea");
                conditionSetArea.find(".conditionSet").remove();
                conditionSetData = CurrentItem.data("conditionSets");
                for (conditionSetIndex = 0; conditionSetIndex < conditionSetData.length; conditionSetIndex++) {
                    currentConditionSetData = conditionSetData[conditionSetIndex];
                    if (currentConditionSetData.SetRelation == "OR")
                        prefix = "OR a";
                    else
                        prefix = "AND a";
                    newConditionSet = $(ConditionSetTemplate);
                    newConditionSet.find(".conditionSetPrefix").text(prefix);
                    conditionSetArea.append(newConditionSet);
                    if (conditionSetIndex == 0)
                        newConditionSet.find(".conditionSetPrefix").text("A");
                    conditionTable = newConditionSet.find(".conditionTable");
                    for (conditionIndex = 0; conditionIndex < currentConditionSetData.Conditions.length; conditionIndex++)
                    {
                        currentConditionData = currentConditionSetData.Conditions[conditionIndex];
                        newCondition = $(ConditionTemplate);
                        if (conditionIndex > 0)
                            newCondition.find(".conditionOperator").text(currentConditionData.Relation.toLowerCase());
                        conditionTable.append(newCondition);
                        columnSelect = newCondition.find(".conditionVariableCell select");
                        for (i = 0; i < CurrentTableColumnArray.length; i++) {
                            cData = CurrentTableColumnArray[i];
                            switch (cData.Type) {
                                case "varchar":
                                    columnType = "string";
                                    break;
                                case "boolean":
                                    columnType = "bool";
                                    break;
                                case "integer":
                                    columnType = "int";
                                    break;
                                default:
                                    columnType = "unknown";
                            }
                            columnSelect.append($('<option varType="' + columnType + '">' + cData.Name + '</option>'));
                        }
                        columnSelect.val(currentConditionData.Variable);
                        var optionSelected = $("option:selected", columnSelect);
                        varType = optionSelected.attr("varType");
                        newCondition.find(".conditionOperatorCell select, .conditionValueCell select, .conditionValueCell input").remove();
                        conditionValueCell = newCondition.find(".conditionValueCell");
                        conditionOperatorCell = newCondition.find(".conditionOperatorCell");
                        switch (varType) {
                            case "bool":
                                conditionValueCell.append($('<select><option selected="selected">true</option><<option>false</option></select>'));
                                conditionOperatorCell.append($('<select><option>==</option><option>!=</option></select>'));
                                conditionOperatorCell.find("select").val(currentConditionData.Operator);
                                break;
                            case "int":
                                conditionValueCell.append($('<input type="number"></input>'));
                                conditionOperatorCell.append($('<select><option>==</option><option>!=</option><option>&gt;</option><option>&gt;=</option><option>&lt;</option><option>&lt;=</option>'));
                                conditionOperatorCell.find("select").val(currentConditionData.Operator);
                                break;
                            case "string":
                                conditionValueCell.append($('<input type="text"></input>'));
                                conditionOperatorCell.append($('<select><option>==</option><option>!=</option><option>contains</option><option inputType="none">is empty</option><option inputType="none">is not empty</option></select>'));
                                conditionOperatorCell.find("select").val(currentConditionData.Operator);
                                break;
                            case "unknown":
                            default:
                                conditionValueCell.append($('<input type="text"></input>'));
                                conditionOperatorCell.append($('<select><option>==</option><option>!=</option><option>&gt;</option><option>&gt;=</option><option>&lt;</option><option>&lt;=</option><option>contains</option><option inputType="none">is empty</option><option inputType="none">is not empty</option></select>'));
                                conditionOperatorCell.find("select").val(currentConditionData.Operator);
                        }
                        var optionSelected = $("option:selected", conditionOperatorCell);
                        inputType = optionSelected.attr("inputType");
                        if (inputType === "none")
                            conditionValueCell.find("input, select").hide();
                        else {
                            if (conditionValueCell.find("input").length > 0) {
                                conditionValueCell.find("input").show();
                                conditionValueCell.find("input").val(currentConditionData.Value);
                            }
                            else if (conditionValueCell.find("select").length > 0) {
                                conditionValueCell.find("select").show();
                                conditionValueCell.find("select").val(currentConditionData.Value);
                            }
                        }
                    }
                }
            }
        });
        function conditionsDialog_SubmitData() {
            setArray = [];
            conditionsDialog.find(".conditionSet").each(function (setIndex, setElement) {
                currentSet = $(setElement);
                conditionArray = [];
                currentSet.find(".conditionTable tr").each(function (index, element) {
                    currentCondition = $(element);
                    relationCellValue = currentCondition.find(".conditionOperator").text();
                    if (relationCellValue == "")
                        relation = "AND";
                    else
                        relation = relationCellValue.toUpperCase();
                    if (currentCondition.find(".conditionValueCell select").length > 0)
                        value = currentCondition.find(".conditionValueCell select option:selected").text();
                    else
                        value = currentCondition.find(".conditionValueCell input").val();
                    conditionArray.push({
                        Index: index,
                        Relation: relation,
                        Variable: currentCondition.find(".conditionVariableCell select option:selected").text(),
                        Operator: currentCondition.find(".conditionOperatorCell select option:selected").text(),
                        Value: value
                    });
                });
                setPrefix = currentSet.find(".conditionSetPrefix").text();
                if (setPrefix == "OR a")
                    setRelation = "OR";
                else
                    setRelation = "AND";
                setArray.push({
                    SetIndex: setIndex,
                    SetRelation: setRelation,
                    Conditions: conditionArray
                });
            });
            CurrentItem.data("conditionSets", setArray);
            conditionsDialog.dialog("close");
        }
    }
    chooseWhitelistRolesDialog = $("#choose-whitelist-roles-dialog").dialog({
        autoOpen: false,
        width: 450,
        height: 500,
        buttons: {
            "Change": function () {
                chooseWhitelistRolesDialog_SubmitData();
            },
            Cancel: function () {
                chooseWhitelistRolesDialog.dialog("close");
            }
        },
        open: function (event, ui) {
            chooseWhitelistRolesDialog.find("#role-table:first tbody:nth-child(2) tr").remove();
            chooseWhitelistRolesDialog.find(".spinner-2").show();
            appId = $("#currentAppId").val();
            $.ajax({
                type: "GET",
                url: "/api/Persona/app-roles/" + appId,
                dataType: "json",
                success: function (data) {
                    tbody = chooseWhitelistRolesDialog.find("#role-table tbody:nth-child(2)");
                    for (i = 0; i < data.Roles.length; i++) {
                        newTableRow = $('<tr class="roleRow"><td>' + data.Roles[i].Name + '</td></tr>');
                        if (RoleWhitelist.indexOf(data.Roles[i].Name) != -1)
                            newTableRow.addClass("highlightedRow");
                        tbody.append(newTableRow);
                        newTableRow.on("click", function (event) {
                            $(this).toggleClass("highlightedRow");
                        });
                    }
                    chooseWhitelistRolesDialog.find(".spinner-2").hide();
                }
            });
        }
    });
    function chooseWhitelistRolesDialog_SubmitData() {
        RoleWhitelist = [];
        roleCount = 0;
        chooseWhitelistRolesDialog.find("#role-table:first tbody:nth-child(2) tr").each(function (index, element) {
            if ($(element).hasClass("highlightedRow")) {
                RoleWhitelist.push($(element).find("td").text());
                roleCount++;
            }
        });
        $("#blockHeaderRolesCount").text(roleCount);
        chooseWhitelistRolesDialog.dialog("close");
    }
    gatewayConditionsDialog = $("#gateway-conditions-dialog").dialog({
        autoOpen: false,
        width: 800,
        height: 560,
        buttons: {
            "Save": function () {
                gatewayConditionsDialog_SubmitData();
            },
            Cancel: function () {
                gatewayConditionsDialog.dialog("close");
                CurrentItem.removeClass("activeItem");
            }
        },
        create: function () {
            $(this).keypress(function (e) {
                if (e.keyCode == $.ui.keyCode.ENTER) {
                    gatewayConditionsDialog_SubmitData();
                    return false;
                }
            });
            $(this).find(".addAndConditionSetIcon").on("click", function () {
                newConditionSet = $(ConditionSetTemplate);
                newConditionSet.find(".conditionSetPrefix").text("AND a");
                newConditionSet.find(".conditionTable").append($(ManualInputConditionTemplate));
                gatewayConditionsDialog.find(".conditionSetArea").append(newConditionSet);
                if (newConditionSet.index() == 0)
                    newConditionSet.find(".conditionSetPrefix").text("A");
            });
            $(this).find(".addOrConditionSetIcon").on("click", function () {
                newConditionSet = $(ConditionSetTemplate);
                newConditionSet.find(".conditionSetPrefix").text("OR a");
                newConditionSet.find(".conditionTable").append($(ManualInputConditionTemplate));
                gatewayConditionsDialog.find(".conditionSetArea").append(newConditionSet);
                if (newConditionSet.index() == 0)
                    newConditionSet.find(".conditionSetPrefix").text("A");
            });
            $(this).on("click", ".addAndConditionIcon", function () {
                newCondition = $(ManualInputConditionTemplate);
                newCondition.find(".conditionOperator").text("and");
                $(this).parents("tr").after(newCondition);
            });
            $(this).on("click", ".addOrConditionIcon", function () {
                newCondition = $(ManualInputConditionTemplate);
                newCondition.find(".conditionOperator").text("or");
                $(this).parents("tr").after(newCondition);
            });
            $(this).on("click", ".removeConditionIcon", function () {
                currentCondition = $(this).parents("tr");
                if (currentCondition.index() == 0)
                    currentCondition.parents("table").find("tr:eq(1)").find(".conditionOperator").text("");
                if (currentCondition.parents("table").find("tr").length == 1) {
                    if (currentCondition.parents(".conditionSet").index() == 0)
                        currentCondition.parents(".conditionSetArea").find(".conditionSet:eq(1)").find(".conditionSetPrefix").text("A");
                    currentCondition.parents(".conditionSet").remove();
                }
                else
                    currentCondition.remove();
            });
            $(this).on("click", ".removeConditionSetIcon", function () {
                currentConditionSet = $(this).parents(".conditionSet");
                if (currentConditionSet.index() == 0)
                    currentConditionSet.parents(".conditionSetArea").find(".conditionSet:eq(1)").find(".conditionSetPrefix").text("A");
                currentConditionSet.remove();
            });
            $(this).on("change", ".conditionOperatorCell select", function () {
                currentCondition = $(this).parents("tr");
                var optionSelected = $("option:selected", this);
                inputType = optionSelected.attr("inputType");
                if (inputType === "none")
                    currentCondition.find(".conditionValueCell input, .conditionValueCell select").hide();
                else
                    currentCondition.find(".conditionValueCell input, .conditionValueCell select").show();
            });
        },
        open: function () {
            conditionSetArea = gatewayConditionsDialog.find(".conditionSetArea");
            conditionSetArea.find(".conditionSet").remove();
            conditionSetData = CurrentItem.data("conditionSets");
            if (!conditionSetData)
                conditionSetData = [];
            for (conditionSetIndex = 0; conditionSetIndex < conditionSetData.length; conditionSetIndex++) {
                currentConditionSetData = conditionSetData[conditionSetIndex];
                if (currentConditionSetData.SetRelation == "OR")
                    prefix = "OR a";
                else
                    prefix = "AND a";
                newConditionSet = $(ConditionSetTemplate);
                newConditionSet.find(".conditionSetPrefix").text(prefix);
                conditionSetArea.append(newConditionSet);
                if (conditionSetIndex == 0)
                    newConditionSet.find(".conditionSetPrefix").text("A");
                conditionTable = newConditionSet.find(".conditionTable");
                for (conditionIndex = 0; conditionIndex < currentConditionSetData.Conditions.length; conditionIndex++) {
                    currentConditionData = currentConditionSetData.Conditions[conditionIndex];
                    newCondition = $(ManualInputConditionTemplate);
                    if (conditionIndex > 0)
                        newCondition.find(".conditionOperator").text(currentConditionData.Relation.toLowerCase());
                    conditionTable.append(newCondition);
                    columnSelect = newCondition.find(".conditionVariableCell input");
                    columnSelect.val(currentConditionData.Variable);
                    conditionOperatorCell = newCondition.find(".conditionOperatorCell");
                    conditionOperatorCell.find("select").val(currentConditionData.Operator);
                    conditionValueCell = newCondition.find(".conditionValueCell");
                    var optionSelected = $("option:selected", conditionOperatorCell);
                    inputType = optionSelected.attr("inputType");
                    if (inputType === "none")
                        conditionValueCell.find("input").hide();
                    else {
                        conditionValueCell.find("input").show();
                        conditionValueCell.find("input").val(currentConditionData.Value);
                    }
                }
            }
        }
    });
    function gatewayConditionsDialog_SubmitData() {
        setArray = [];
        gatewayConditionsDialog.find(".conditionSet").each(function (setIndex, setElement) {
            currentSet = $(setElement);
            conditionArray = [];
            currentSet.find(".conditionTable tr").each(function (index, element) {
                currentCondition = $(element);
                relationCellValue = currentCondition.find(".conditionOperator").text();
                if (relationCellValue == "")
                    relation = "AND";
                else
                    relation = relationCellValue.toUpperCase();
                conditionArray.push({
                    Index: index,
                    Relation: relation,
                    Variable: currentCondition.find(".conditionVariableCell input").val(),
                    Operator: currentCondition.find(".conditionOperatorCell select option:selected").text(),
                    Value: currentCondition.find(".conditionValueCell input").val()
                });
            });
            setPrefix = currentSet.find(".conditionSetPrefix").text();
            if (setPrefix == "OR a")
                setRelation = "OR";
            else
                setRelation = "AND";
            setArray.push({
                SetIndex: setIndex,
                SetRelation: setRelation,
                Conditions: conditionArray
            });
        });
        CurrentItem.data("conditionSets", setArray).removeClass("activeItem");
        gatewayConditionsDialog.dialog("close");
    }
});

$(function () {
    if (CurrentModuleIs("tapestryModule")) {
        $.contextMenu({
            selector: '.item, .symbol',
            trigger: 'right',
            zIndex: 300,
            callback: function (key, options) {
                item = options.$trigger;
                if (key == "delete") {
                    currentInstance = item.parents(".rule").data("jsPlumbInstance");
                    currentInstance.removeAllEndpoints(item, true);
                    item.remove();
                    ChangedSinceLastSave = true;
                }
                else if (key == "properties") {
                    item.addClass("activeItem processedItem");
                    if (item.hasClass("tableAttribute")) {
                        CurrentItem = item;
                        tableAttributePropertiesDialog.dialog("open");
                    }
                    else if (item.hasClass("actionItem") && item.parents(".rule").hasClass("workflowRule")) {
                        CurrentItem = item;
                        actionPropertiesDialog.dialog("open");
                    }
                    else if (item.hasClass("symbol") && item.attr("symboltype") == "gateway-x")
                    {
                        CurrentItem = item;
                        gatewayConditionsDialog.dialog("open");
                    }
                    else if (item.hasClass("uiItem")) {
                        CurrentItem = item;
                        uiitemPropertiesDialog.dialog("open");
                    }
                    else if (item.hasClass("symbol") && item.attr("symbolType") === "comment") {
                        CurrentItem = item;
                        labelPropertyDialog.dialog("open");
                    }
                    else {
                        alert("Pro tento typ objektu nejsou dostupná žádná nastavení.");
                        item.removeClass("activeItem");
                    }
                }
            },
            items: {
                "properties": { name: "Properties", icon: "edit" },
                "delete": { name: "Delete", icon: "delete" }
            }
        });
        $.contextMenu({
            selector: '.resourceRule',
            trigger: 'right',
            zIndex: 300,
            callback: function (key, options) {
                item = options.$trigger;
                if (key == "delete") {
                    item.remove();
                    ChangedSinceLastSave = true;
                }
            },
            items: {
                "delete": { name: "Delete rule", icon: "delete" }
            }
        });
        $.contextMenu({
            selector: '.swimlaneRolesArea .roleItem',
            trigger: 'right',
            zIndex: 300,
            callback: function (key, options) {
                item = options.$trigger;
                if (key == "delete") {
                    swimlaneRolesArea = item.parents(".swimlaneRolesArea");
                    item.remove();
                    if (swimlaneRolesArea.find(".roleItem").length == 0)
                        swimlaneRolesArea.append($('<div class="rolePlaceholder"><div class="rolePlaceholderLabel">'
                            + 'Pokud chcete specifikovat roli<br />přetáhněte ji do této oblasti</div></div>'));
                    ChangedSinceLastSave = true;
                }
            },
            items: {
                "delete": { name: "Remove role", icon: "delete" }
            }
        });
        $.contextMenu({
            selector: '.workflowRule',
            trigger: 'right',
            zIndex: 300,
            callback: function (key, options) {
                if (key == "rename") {
                    CurrentRule = options.$trigger;
                    renameRuleDialog.dialog("open");
                }
                else if (key == "delete") {
                    options.$trigger.remove();
                    ChangedSinceLastSave = true;
                }
                else if (key == "add-swimlane") {
                    rule = options.$trigger;
                    newSwimlane = $('<div class="swimlane"><div class="swimlaneRolesArea"><div class="roleItemContainer"></div><div class="rolePlaceholder"><div class="rolePlaceholderLabel">Pokud chcete specifikovat roli<br />'
                        + 'přetáhněte ji do této oblasti</div></div></div><div class="swimlaneContentArea"></div></div>');
                    newSwimlane.find(".swimlaneRolesArea").droppable({
                        containment: ".swimlaneContentArea",
                        tolerance: "touch",
                        accept: ".toolboxItem.roleItem",
                        greedy: true,
                        drop: function (e, ui) {
                            if (dragModeActive) {
                                dragModeActive = false;
                                roleExists = false;
                                $(this).find(".roleItem").each(function (index, element) {
                                    if ($(element).text() == ui.helper.text())
                                        roleExists = true;
                                });
                                if (!roleExists) {
                                    droppedElement = ui.helper.clone();
                                    $(this).find(".rolePlaceholder").remove();
                                    $(this).find(".roleItemContainer").append($('<div class="roleItem">' + droppedElement.text() + '</div>'));
                                    ui.helper.remove();
                                    ChangedSinceLastSave = true;
                                }
                            }
                        }
                    });
                    newSwimlane.find(".swimlaneContentArea").droppable({
                        containment: ".swimlaneContentArea",
                        tolerance: "touch",
                        accept: ".toolboxSymbol, .toolboxItem",
                        greedy: false,
                        drop: function (e, ui) {
                            if (dragModeActive) {
                                dragModeActive = false;
                                droppedElement = ui.helper.clone();
                                if (droppedElement.hasClass("roleItem")) {
                                    ui.draggable.draggable("option", "revert", true);
                                    return false;
                                }
                                $(this).append(droppedElement);
                                ruleContent = $(this);
                                if (droppedElement.hasClass("toolboxSymbol")) {
                                    droppedElement.removeClass("toolboxSymbol ui-draggable ui-draggable-dragging");
                                    droppedElement.addClass("symbol");
                                    leftOffset = $("#tapestryWorkspace").offset().left - ruleContent.offset().left;
                                    topOffset = $("#tapestryWorkspace").offset().top - ruleContent.offset().top;
                                }
                                else {
                                    droppedElement.removeClass("toolboxItem");
                                    droppedElement.addClass("item");
                                    leftOffset = $("#tapestryWorkspace").offset().left - ruleContent.offset().left + 38;
                                    topOffset = $("#tapestryWorkspace").offset().top - ruleContent.offset().top - 18;
                                }
                                droppedElement.offset({ left: droppedElement.offset().left + leftOffset, top: droppedElement.offset().top + topOffset });
                                ui.helper.remove();
                                AddToJsPlumb(droppedElement);
                                ChangedSinceLastSave = true;
                            }
                        }
                    });
                    rule.find(".swimlaneArea").append(newSwimlane);
                    newHeight = (100 / rule.find(".swimlane").length);
                    rule.find(".swimlane").each(function (swimlaneIndex, swimlaneDiv) {
                        $(swimlaneDiv).css("height", newHeight + "%");
                    });
                    instance = options.$trigger.data("jsPlumbInstance");
                    instance.recalculateOffsets();
                    instance.repaintEverything();
                    ChangedSinceLastSave = true;
                }
            },
            items: {
                "add-swimlane": { name: "Add swimlane", icon: "add" },
                "rename": { name: "Rename rule", icon: "edit" },
                "delete": { name: "Delete rule", icon: "delete" }
            }
        });
        $.contextMenu({
            selector: '.swimlane',
            trigger: 'right',
            zIndex: 300,
            callback: function (key, options) {
                if (key == "remove-swimlane") {
                    rule = options.$trigger.parents(".workflowRule");
                    swimlaneCount = rule.find(".swimlane").length;
                    if (swimlaneCount > 1) {
                        instance = rule.data("jsPlumbInstance");
                        instance.removeAllEndpoints(options.$trigger, true);
                        options.$trigger.remove();
                        newHeight = 100 / (swimlaneCount - 1);
                        rule.find(".swimlane").each(function (swimlaneIndex, swimlaneDiv) {
                            $(swimlaneDiv).css("height", newHeight + "%");
                        });
                        instance.recalculateOffsets();
                        instance.repaintEverything();
                        ChangedSinceLastSave = true;
                    }
                    else
                        alert("Pravidlo musí mít alspoň jednu swimlane, nelze smazat všechny.");
                }
            },
            items: {
                "remove-swimlane": { name: "Remove swimlane", icon: "delete" },
            }
        });
        $.contextMenu({
            selector: '.tableRow',
            trigger: 'right',
            zIndex: 300,
            callback: function (key, options) {
                if (key == "model") {
                    tableRow = options.$trigger;
                    tableRow.addClass("highlightedRow");
                    tableRow.parents("table").find(".modelMarker").remove();
                    tableRow.find("td:first").append('<div class="modelMarker">Model</div>');
                }
            },
            items: {
                "model": { name: "Set as model", icon: "edit" }
            }
        });
    }
});

ConditionData = [];

ConditionsRelationList = ["AND", "OR", "XOR"];

ConditionsOperatorList = ["=", "!=", ">", ">=", "<", "<="];

FakeInputsForTesting = [
    "Username.Value",
    "Password.Value",
    "LogIn.Success",
    "LogIn.AttemptCount",
    "LogIn.UserGroup",
    "Global.BlockReferal",
    "Global.BlockStartTimestamp"
]

function FillConditionsForLogicTableRow(row) {
    row.find(".selectRelation option").remove();
    for (i = 0; i < ConditionsRelationList.length; i++) {
        row.find(".selectRelation").append(
            $('<option value="' + ConditionsRelationList[i] + '">' + ConditionsRelationList[i] + '</option>'));
    }
    row.find(".selectField option").remove();
    for (i = 0; i < FakeInputsForTesting.length; i++) {
        row.find(".selectField").append(
            $('<option value="' + FakeInputsForTesting[i] + '">' + FakeInputsForTesting[i] + '</option>'));
    }
    row.find(".selectOperator option").remove();
    for (i = 0; i < ConditionsOperatorList.length; i++) {
        row.find(".selectOperator").append(
            $('<option value="' + ConditionsOperatorList[i] + '">' + ConditionsOperatorList[i] + '</option>'));
    }
}

function LoadModuleAdminScript() {
    $("#moduleAdminPanel .moduleSquare").on("click", function () {
        $("#moduleAdminPanel .moduleSquare").removeClass("selectedSquare");
        $(this).addClass("selectedSquare");
        $("#moduleConfigPanel .currentModuleIcon").css("background-image", $(this).css("background-image"));
        $("#moduleConfigPanel .currentModuleName").text($(this).attr("moduleName"));
    });
}
$(function () {
    if ($("#moduleAdminPanel").length) {
        LoadModuleAdminScript();
    }
});
var maintenanceModeActive = false;

var pageSpinner = (function () {
    var debug = false;
    var uses = 1;
    return {
        show: function (n) {
            if (!arguments.length) {
                n = 1;
            }
            uses += n;
            if (uses > 0) {
                $(document.body).addClass("pageSpinnerShown");
            }
            if (debug) {
                console.log("page spinner shown %d times, %d total", n, uses);
                console.trace();
            }
        },
        hide: function (n) {
            if (!arguments.length) {
                n = 1;
            }
            uses -= n;
            if (uses <= 0) {
                $(document.body).removeClass("pageSpinnerShown");
            }
            if (debug) {
                console.log("page spinner hidden %d times, %d remaining", n, uses);
                console.trace();
            }
        }
    }
})()

$(function () {
    var currentModule = document.body.getAttribute("data-module");

    $(document).on("ajaxError", function (event, jqxhr, settings, thrownError) {
        ShowAppNotification(jqxhr.responseText || "nastala chyba sítě", "error");
    })
    $(window).on("error", function () {
        ShowAppNotification("Nastala neočekávaná chyba", "error");
    })
    $("[data-ajax='true']").data("ajax-failure", function (xhr) {
        ShowAppNotification(xhr.responseText || "nastala chyba sítě", "error");
    }.toString()); 

    pageSpinner.hide();
    $(window).on("beforeunload", function () {
        pageSpinner.show();
    });

    $("#identitySuperMenu").on("click", function () {
        $("#leftBar .leftMenu li.identitySubMenu").slideToggle();
    });
    $("#appSuperMenu").on("click", function () {
        $("#leftBar .leftMenu li.appSubMenu").slideToggle();
    });

    if (CurrentModuleIs("portalModule")) {
        $("#adminMenuPortal").addClass("active");
    }
    else if (CurrentModuleIs("adminAppModule")) {
        $("#adminMenuApps").addClass("active");
        
    }
    else if (CurrentModuleIs("nexusModule")) {
        $("#adminMenuNexus").addClass("active");
    }
    else if (CurrentModuleIs("tapestryModule") || CurrentModuleIs("overviewModule")) {
        $("#adminMenuTapestry").addClass("active");
        $("#leftBar .leftMenu li.appSubMenu").show();
    }
    else if (CurrentModuleIs("mozaicModule") || CurrentModuleIs("mozaicEditorModule")) {
        $("#adminMenuMozaic").addClass("active");
        $("#leftBar .leftMenu li.appSubMenu").show();
    }
    else if (CurrentModuleIs("dbDesignerModule")) {
        $("#adminMenuDbDesigner").addClass("active");
        $("#leftBar .leftMenu li.appSubMenu").show();
    }
    else if (CurrentModuleIs("personaModule") || CurrentModuleIs("personaRolesModule")) {
        $("#adminMenuPersona").addClass("active");
        $("#leftBar .leftMenu li.identitySubMenu").show();
    }
    else if (CurrentModuleIs("personaModulesModule")) {
        $("#adminMenuPersonaModules").addClass("active");
        $("#leftBar .leftMenu li.identitySubMenu").show();
    }
    else if (CurrentModuleIs("watchtowerModule")) {
        $("#adminMenuWatchtower").addClass("active");
    }
    else if (CurrentModuleIs("hermesModule")) {
        $("#adminMenuHermes").addClass("active");
    }
    else if (CurrentModuleIs("cortexModule")) {
        $("#adminMenuCortex").addClass("active");
    }

    $("#usersOnlineIndicator").on("click", function () {
        $(".clickableIndicatorRectangle").removeClass("highlighted");
        $("#usersOnlineIndicator").addClass("highlighted");
        $.get("/CORE/Portal/UsersOnline").success(function (result) {
            $("#lowerPanelDynamicContainer").html(result);
        });
    });
    $("#activeProfileIndicator").on("click", function () {
        $(".clickableIndicatorRectangle").removeClass("highlighted");
        $("#activeProfileIndicator").addClass("highlighted");
        $.get("/CORE/Portal/ActiveProfile").success(function (result) {
            $("#lowerPanelDynamicContainer").html(result);
        });
    });
    $("#activeModulesIndicator").on("click", function () {
        $(".clickableIndicatorRectangle").removeClass("highlighted");
        $("#activeModulesIndicator").addClass("highlighted");
        $.get("/CORE/Portal/ModuleAdmin").success(function (result) {
            $("#lowerPanelDynamicContainer").html(result);
            LoadModuleAdminScript();
        });
    });
    $("#maintenanceIndicator").on("click", function () {
        if (maintenanceModeActive) {
            $("#maintenanceIndicator").removeClass("maintenanceActive");
            $("#maintenanceIndicator .indicatorLabel").text("vypnuta");
            maintenanceModeActive = false;
        }
        else {
            $("#maintenanceIndicator").addClass("maintenanceActive");
            $("#maintenanceIndicator .indicatorLabel").text("zapnuta");
            maintenanceModeActive = true;
        }
    });
    $("#notificationArea .indicatorBar").on("click", function () {
        $(this).remove();
    });

    $("#hideUpperPanelIcon").on("click", function () {
        $("#minimizedUpperPanel").show();
        $("#lowerPanel").css({ top: "+=" + $("#minimizedUpperPanel").height() + "px" });
        $("#lowerPanel").css({ top: "-=" + $("#upperPanel").height() + "px" });
        $("#upperPanel").hide();
        if (CurrentModuleIs("tapestryModule"))
            RecalculateToolboxHeight();
        else if (CurrentModuleIs("mozaicEditorModule"))
            RecalculateMozaicToolboxHeight();
    });
    $("#showUpperPanelIcon").on("click", function () {
        $("#upperPanel").show();
        $("#lowerPanel").css({ top: "+=" + $("#upperPanel").height() + "px" });
        $("#lowerPanel").css({ top: "-=" + $("#minimizedUpperPanel").height() + "px" });
        $("#minimizedUpperPanel").hide();
        if (CurrentModuleIs("tapestryModule"))
            RecalculateToolboxHeight();
        else if (CurrentModuleIs("mozaicEditorModule"))
            RecalculateMozaicToolboxHeight();
    });
    $("#topBar").width($(window).width());
    $("#upperPanel").width($(window).width() - 225);
    $("#minimizedUpperPanel").width($(window).width() - 225);
    $(window).on("resize", function () {
        $("#topBar").width($(window).width());
        $("#upperPanel").width($(window).width() - 225);
        $("#minimizedUpperPanel").width($(window).width() - 225);
    });
});

function SaveModulePermissions() {
    permissionArray = [];

    var rows = $("#moduleAccessTable").dataTable().fnGetNodes();
    for (var i = 0; i < rows.length; i++) {
        var userId = parseInt($(rows[i]).find("td:eq(0)").text());
      
        permissionArray.push({
            UserId: userId,
            Core: ($(rows[i]).find("td[moduleId=Core]").hasClass("yesCell")),
            Master: ($(rows[i]).find("td[moduleId=Master]").hasClass("yesCell")),
            Tapestry: ($(rows[i]).find("td[moduleId=Tapestry]").hasClass("yesCell")),
            Entitron: ($(rows[i]).find("td[moduleId=Entitron]").hasClass("yesCell")),
            Persona: ($(rows[i]).find("td[moduleId=Persona]").hasClass("yesCell")),
            Nexus: ($(rows[i]).find("td[moduleId=Nexus]").hasClass("yesCell")),
            Sentry: ($(rows[i]).find("td[moduleId=Sentry]").hasClass("yesCell")),
            Hermes: ($(rows[i]).find("td[moduleId=Hermes]").hasClass("yesCell")),
            Athena: ($(rows[i]).find("td[moduleId=Athena]").hasClass("yesCell")),
            Watchtower: ($(rows[i]).find("td[moduleId=Watchtower]").hasClass("yesCell")),
            Cortex: ($(rows[i]).find("td[moduleId=Cortex]").hasClass("yesCell")),
            Mozaic: ($(rows[i]).find("td[moduleId=Mozaic]").hasClass("yesCell"))
        });
    }
   
    postData = {
        PermissionList: permissionArray
    };
    $.ajax({
        type: "POST",
        url: "/api/persona/module-permissions",
        data: postData,
        success: function () { alert("Module permissions has been updated!") }
    });
}

$(function () {
    if (CurrentModuleIs("personaModulesModule") || CurrentModuleIs("personaRolesModule")) {
        $('body').on('click','.checkboxCell', function () {

            checkboxCell = $(this);
            if (checkboxCell.hasClass("yesCell")) {
                checkboxCell.removeClass("yesCell");
                checkboxCell.addClass("noCell");
                checkboxCell.find(".fa").removeClass("fa-check").addClass("fa-times");
            }
            else {
                checkboxCell.removeClass("noCell");
                checkboxCell.addClass("yesCell");
                checkboxCell.find(".fa").removeClass("fa-times").addClass("fa-check");
            }
        });
    }
    if (CurrentModuleIs("personaModulesModule")) {
        $('body').on('click','#btnSaveModuleAccessTable', function () {
            SaveModulePermissions();
        });
        $('body').on('click','#btnReloadModuleAccessTable', function () {

            location.reload();
        });
    }
});

var instance;

jsPlumb.ready(function () {
    if (CurrentModuleIs("overviewModule")) {
        instance = jsPlumb.getInstance({
            ConnectionOverlays: [
                ["Arrow", { location: 1 }]
            ],
            Container: "#overviewPanel .scrollArea",
            Endpoint: "Blank",
            Anchor: "Continuous",
            Connector: ["Straight", { stub: [0, 0], gap: 0 }]
        });
        connectorPaintStyle = {
            lineWidth: 3,
            strokeStyle: "#455d73"
        };
        LoadMetablock();
    }
});

function SaveMetablock(callback, pageUnloading) {
    pageSpinner.show();
    blockArray = [];
    metablockArray = [];

    $("#overviewPanel .block").each(function (blockIndex, blockDiv) {
        currentBlock = $(blockDiv);
        currentBlock.attr("tempId", blockIndex);
        if (currentBlock.attr("blockId") == undefined) {
            isNew = true;
            currentBlock.attr("blockId", blockIndex);
        }
        else
            isNew = false;
        blockArray.push({
            Id: currentBlock.attr("blockId"),
            Name: currentBlock.find(".blockName").text(),
            AssociatedTableName: "",
            AssociatedTableId: currentBlock.attr("tableId"),
            PositionX: parseInt(currentBlock.css("left")),
            PositionY: parseInt(currentBlock.css("top")),
            IsNew: isNew,
            IsInitial: (currentBlock.attr("isInitial") == "true"),
            IsInMenu: currentBlock.data("IsInMenu") ? true : false
        });
    });
    $("#overviewPanel .metablock").each(function (metablockIndex, metablockDiv) {
        currentMetablock = $(metablockDiv);
        currentMetablock.attr("tempId", metablockIndex);
        if (currentMetablock.attr("metablockId") == undefined) {
            isNew = true;
            currentMetablock.attr("metablockId", metablockIndex);
        }
        else
            isNew = false;
        metablockArray.push({
            Id: currentMetablock.attr("metablockId"),
            Name: currentMetablock.find(".metablockName").text(),
            PositionX: parseInt(currentMetablock.css("left")),
            PositionY: parseInt(currentMetablock.css("top")),
            IsNew: isNew,
            IsInitial: (currentMetablock.attr("isInitial") == "true"),
            IsInMenu: currentMetablock.data("IsInMenu") ? true : false
        });
    });
    postData = {
        Name: $("#headerMetablockName").text(),
        Blocks: blockArray,
        Metablocks: metablockArray
    };
    appId = $("#currentAppId").val();
    metablockId = $("#currentMetablockId").val();
    $.ajax({
        type: "POST",
        url: "/api/tapestry/apps/" + appId + "/metablocks/" + metablockId,
        dataType: "json",
        data: postData,
        async: !pageUnloading,
        complete: function () {
            pageSpinner.hide()
        },
        success: function (data) {
            for (i = 0; i < data.BlockIdPairs.length; i++) {
                temporaryId = data.BlockIdPairs[i].TemporaryId;
                realId = data.BlockIdPairs[i].RealId;
                $("#overviewPanel .block[tempId='" + temporaryId + "']").attr("blockId", realId);
            }
            for (i = 0; i < data.MetablockIdPairs.length; i++) {
                temporaryId = data.MetablockIdPairs[i].TemporaryId;
                realId = data.MetablockIdPairs[i].RealId;
                $("#overviewPanel .metablock[tempId='" + temporaryId + "']").attr("metablockId", realId);
            }
            ChangedSinceLastSave = false;
            if (callback) callback();
        }
    });
}

$(function ()
{
    if($('body').hasClass('menuOrderModule'))
    {
        $('ul.sortable').sortable();

        $('#menuOrderForm').on('submit', function () {
            return false;
        });

        $('#btnOverview').click(function () {
            $('#openMetablockForm').submit();
        });

        $('#btnSave').click(function () {

            pageSpinner.show();
            
            var metablockOrder = {};
            var blockOrder = {};

            var i = 1;
            $('.sortable input[type=hidden]').each(function () {
                if ($(this).is('.metablock')) {
                    metablockOrder[this.value] = i;
                }
                else {
                    blockOrder[this.value] = i;
                }
                i++;
            });

            var postData = {
                Blocks: blockOrder,
                Metablocks: metablockOrder
            };

            $.ajax({
                type: "POST",
                url: "/api/tapestry/saveMenuOrder",
                contentType: 'application/json; charset=UTF-8',
                data: JSON.stringify(postData),
                complete: function () {
                    pageSpinner.hide()
                },
                success: function () {
                    ChangedSinceLastSave = true;
                }
            });
        });
    }
});
function LoadMetablock() {
    pageSpinner.show();
    appId = $("#currentAppId").val();
    metablockId = $("#currentMetablockId").val();
    url = "/api/tapestry/apps/" + appId + "/metablocks/" + metablockId;
    $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        complete: function () {
            pageSpinner.hide()
        },
        success: function (data) {
            $("#headerMetablockName").text(data.Name);
            $("#overviewPanel .block, #overviewPanel .metablock").each(function (index, element) {
                instance.removeAllEndpoints(element, true);
                $(element).remove();
            });
            for (i = 0; i < data.Blocks.length; i++) {
                currentBlockData = data.Blocks[i];
                newBlock = $('<div class="block" id="block' + currentBlockData.Id + '" isInitial="' + currentBlockData.IsInitial + '" style="left: '
                    + currentBlockData.PositionX + 'px; top: ' + currentBlockData.PositionY + 'px;" blockId="'
                    + currentBlockData.Id + '" tableId="' + currentBlockData.AssociatedTableId + '"><div class="blockName">'
                    + currentBlockData.Name + '</div><div class="blockInfo">'
                    + (currentBlockData.IsInitial ? 'Initial' : '') + '</div></div>');
                newBlock.data("IsInMenu", currentBlockData.IsInMenu);
                $("#overviewPanel .scrollArea").append(newBlock);
                instance.draggable(newBlock, {
                    containment: "parent",
                    stop: function () {
                        ChangedSinceLastSave = true;
                    }
                });
                newBlock.on("dblclick", function () {
                    blockToOpen = $(this);
                    SaveMetablock(function () {
                        openBlockForm = $("#openBlockForm");
                        openBlockForm.find("input[name='blockId']").val(blockToOpen.attr("blockId"));
                        openBlockForm.submit();
                    });                    
                });
            }
            for (i = 0; i < data.Metablocks.length; i++) {
                currentMetablockData = data.Metablocks[i];
                newMetablock = $('<div class="metablock" id="metablock' + currentMetablockData.Id + '" isInitial="' + currentMetablockData.IsInitial + '"style="left: '
                    + currentMetablockData.PositionX + 'px; top: ' + currentMetablockData.PositionY + 'px;" metablockId="' +
                    currentMetablockData.Id + '"><div class="metablockName">' + currentMetablockData.Name +
                    '</div><div class="metablockSymbol fa fa-th-large"></div><div class="metablockInfo">'
                    + (currentMetablockData.IsInitial ? 'Initial' : '') + '</div></div>');
                newMetablock.data("IsInMenu", currentMetablockData.IsInMenu);
                $("#overviewPanel .scrollArea").append(newMetablock);
                instance.draggable(newMetablock, {
                    containment: "parent",
                    stop: function () {
                        ChangedSinceLastSave = true;
                    }
                });
                newMetablock.on("dblclick", function () {
                    metablockToOpen = $(this);
                    SaveMetablock(function () {
                        openMetablockForm = $("#openMetablockForm");
                        openMetablockForm.find("input[name='metablockId']").val(metablockToOpen.attr("metablockId"));
                        openMetablockForm.submit();
                    });
                });
            }
            for (i = 0; i < data.Connections.length; i++) {
                console.log("Connection");
                currentConnectonData = data.Connections[i];
                // TODO: implement remote connection representation
                if (currentConnectonData.SourceType == 1)
                    sourceId = "metablock" + currentConnectonData.SourceId;
                else
                    sourceId = "block" + currentConnectonData.SourceId;
                if (currentConnectonData.TargetType == 1)
                    targetId = "metablock" + currentConnectonData.TargetId;
                else
                    targetId = "block" + currentConnectonData.TargetId;
                instance.connect({
                    source: sourceId, target: targetId, editable: false, paintStyle: connectorPaintStyle
                });
            }
        }
    });
}

var ZoomFactor = 1.0;
var currentBlock, currentMetablock;
var ChangedSinceLastSave = false;

$(function () {
    if (CurrentModuleIs("overviewModule")) {
        $("#headerMetablockName").on("click", function () {
            renameMetablockDialog.dialog("open");
        });
        $("#btnAddBlock").on("click", function () {
            addBlockDialog.dialog("open");
        });
        $("#btnAddMetablock").on("click", function () {
            addMetablockDialog.dialog("open");
        });
        $("#btnLoad").on("click", function () {
            if (ChangedSinceLastSave)
                confirmed = confirm("Máte neuložené změny, opravdu si přejete tyto změny zahodit?");
            else
                confirmed = true;
            if (confirmed) {
                LoadMetablock();
            }
        });
        $("#btnMenuOrder").on("click", function () {
            location.href = "/Tapestry/Overview/MenuOrder/" + $('#currentMetablockId').val();
        });
        $("#btnSave").on("click", function () {
            SaveMetablock();
        });
        $("#btnClear").on("click", function () {
            $("#overviewPanel .block, #overviewPanel .metablock").each(function (index, element) {
                instance.removeAllEndpoints(element, true);
                $(element).remove();
            });
        });
        $("#btnGoUp").on("click", function () {
            SaveMetablock(function () {
                openMetablockForm = $("#openMetablockForm");
                openMetablockForm.find("input[name='metablockId']").val($("#parentMetablockId").val());
                openMetablockForm.submit();
            });
        });
        window.onbeforeunload = function () {
            if (ChangedSinceLastSave)
                SaveMetablock(null, true);
            return null;
        };
        $("#btnTrash").on("click", function () {
            trashDialog.dialog("open");
        });
        $("#btnZoomIn").on("click", function () {
            ZoomFactor += 0.1;
            $("#overviewPanel .scrollArea").css("transform", "scale(" + ZoomFactor + ")");
            $("#zoomLabel").text("Zoom " + Math.floor(ZoomFactor * 100) + "%");
        });
        $("#btnZoomOut").on("click", function () {
            if (ZoomFactor >= 0.2)
                ZoomFactor -= 0.1;
            $("#overviewPanel .scrollArea").css("transform", "scale(" + ZoomFactor + ")");
            $("#zoomLabel").text("Zoom " + Math.floor(ZoomFactor * 100) + "%");
        });
        $.contextMenu({
            selector: '.block, .metablock',
            trigger: 'right',
            zIndex: 300,
            callback: function (key, options) {
                switch(key)
                {
                    case "delete": {
                        instance.removeAllEndpoints(options.$trigger, true);
                        options.$trigger.remove();
                        ChangedSinceLastSave = true;
                        SaveMetablock();
                        break;
                    }
                    case "initial": {
                        if (options.$trigger.hasClass("metablock")) {
                            $("#overviewPanel .metablock").each(function (index, element) {
                                $(element).attr("isInitial", false);
                                $(element).find(".metablockInfo").text("");
                            });
                            options.$trigger.attr("isInitial", true);
                            options.$trigger.find(".metablockInfo").text("Initial");
                        }
                        else {
                            $("#overviewPanel .block").each(function (index, element) {
                                $(element).attr("isInitial", false);
                                $(element).find(".blockInfo").text("");
                            });
                            options.$trigger.attr("isInitial", true);
                            options.$trigger.find(".blockInfo").text("Initial");
                        }
                        ChangedSinceLastSave = true;
                        break;
                    }
                    case "properties": {
                        if (options.$trigger.hasClass("metablock")) {
                            currentMetablock = options.$trigger;
                            metablockPropertiesDialog.dialog("open");
                        }
                        else {
                            currentBlock = options.$trigger;
                            blockPropertiesDialog.dialog("open");
                        }
                        break;
                    }
                }
            },
            items: {
                "properties": { name: "Properties", icon: "cog" },
                "initial": { name: "Set as initial", icon: "edit" },
                "delete": { name: "Delete", icon: "delete" }
            }
        });
    }
});

$(function () {
    if (CurrentModuleIs("overviewModule")) {
        addBlockDialog = $("#add-block-dialog").dialog({
            autoOpen: false,
            resizable: false,
            width: 400,
            height: 140,
            buttons: {
                "Add": function () {
                    addBlockDialog_SubmitData();
                },
                Cancel: function () {
                    addBlockDialog.dialog("close");
                }
            },
            create: function () {
                $(this).keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        addBlockDialog_SubmitData();
                        return false;
                    }
                })
            },
            open: function () {
                $(this).find("#block-name").val("");
            }
        });
        function addBlockDialog_SubmitData() {
            blockName = addBlockDialog.find("#block-name").val();
            newBlock = $('<div class="block"><div class="blockName">' + blockName + '</div><div class="blockInfo"></div></div>');
            $("#overviewPanel .scrollArea").append(newBlock);
            instance.draggable(newBlock, { containment: "parent" });
            newBlock.css("top", $("#overviewPanel").scrollTop() + 20);
            newBlock.css("left", $("#overviewPanel").scrollLeft() + 20);
            newBlock.on("dblclick", function () {
                blockToOpen = $(this);
                SaveMetablock(function () {
                    openBlockForm = $("#openBlockForm");
                    openBlockForm.find("input[name='blockId']").val(blockToOpen.attr("blockId"));
                    openBlockForm.submit();
                });
            });
            ChangedSinceLastSave = true;
            addBlockDialog.dialog("close");
        }
        addMetablockDialog = $("#add-metablock-dialog").dialog({
            autoOpen: false,
            resizable: false,
            width: 400,
            height: 140,
            buttons: {
                "Add": function () {
                    addMetablockDialog_SubmitData();
                },
                Cancel: function () {
                    addMetablockDialog.dialog("close");
                }
            },
            create: function () {
                $(this).keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        addMetablockDialog_SubmitData();
                        return false;
                    }
                })
            },
            open: function () {
                $(this).find("#metablock-name").val("");
            }
        });
        function addMetablockDialog_SubmitData() {
            metablockName = addMetablockDialog.find("#metablock-name").val();
            newMetablock = $('<div class="metablock"><div class="metablockName">'
                + metablockName + '</div><div class="metablockSymbol fa fa-th-large"></div><div class="metablockInfo"></div></div>');
            $("#overviewPanel .scrollArea").append(newMetablock);
            instance.draggable(newMetablock, { containment: "parent" });
            newMetablock.css("top", $("#overviewPanel").scrollTop() + 20);
            newMetablock.css("left", $("#overviewPanel").scrollLeft() + 20);
            newMetablock.on("dblclick", function () {
                metablockToOpen = $(this);
                SaveMetablock(function () {
                    openMetablockForm = $("#openMetablockForm");
                    openMetablockForm.find("input[name='metablockId']").val(metablockToOpen.attr("metablockId"));
                    openMetablockForm.submit();
                });
            });
            ChangedSinceLastSave = true;
            addMetablockDialog.dialog("close");
        }
        trashDialog = $("#trash-dialog").dialog({
            autoOpen: false,
            resizable: false,
            width: 700,
            height: 540,
            buttons: {
                "Load": function () {
                    trashDialog_SubmitData();
                },
                Cancel: function () {
                    trashDialog.dialog("close");
                }
            },
            create: function () {
                $(this).keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        trashDialog_SubmitData();
                        return false;
                    }
                })                           
            },
            open: function (event, ui) {
                trashDialog.find("#metablock-table:first tbody:nth-child(2) tr").remove();
                trashDialog.find("#block-table:first tbody:nth-child(2) tr").remove();
                trashDialog.find(" .spinner-2").show();
                trashDialog.data("selectedMetablock", null);
                trashDialog.data("selectedBlock", null);
                appId = $("#currentAppId").val();
                blockId = $("#currentBlockId").val();
                $.ajax({
                    type: "GET",
                    url: "/api/database/apps/" + appId + "/trashDialog",
                    dataType: "json",
                    success: function (data) {
                        tBlockBody = trashDialog.find("#block-table tbody:nth-child(2)");
                        tMetablockBody = trashDialog.find("#metablock-table tbody:nth-child(2)");
                        blockIdArray = [];
                        metablockIdArray = [];

                        // Fill blocks in the block-table rows
                        for (i = 0; i < data[0].length; i++) {
                            blockIdArray.push(data[0][i].Id);
                            newRow = $('<tr class="blockRow"><td>' + data[0][i].Name + '</td></tr>');
                            tBlockBody.append(newRow);
                        }

                        // Highlight the selected block row
                        $(document).on('click', '#block-table tr.blockRow', function (event) {
                            trashDialog.find("#block-table tbody:nth-child(2) tr").removeClass("highlightedBlockRow");
                            trashDialog.find("#metablock-table tbody:nth-child(2) tr").removeClass("highlightedBlockRow");
                            $(this).addClass("highlightedBlockRow");
                            var rowIndex = $(this).index();
                            trashDialog.data("selectedBlockOrMetablock", data[0][rowIndex]);
                            trashDialog.data("selectedTypeOfBlock", "block");
                        });

                        // Fill metablocks in the metablock-table rows
                        for (i = 0; i < data[1].length; i++) {
                            metablockIdArray.push(data[1][i].Id);
                            newRow = $('<tr class="blockRow"><td>' + data[1][i].Name + '</td></tr>');
                            tMetablockBody.append(newRow);
                        }

                        // Highlight the selected metablock row
                        $(document).on('click', '#metablock-table tr.blockRow', function (event) {
                            trashDialog.find("#block-table tbody:nth-child(2) tr").removeClass("highlightedBlockRow");
                            trashDialog.find("#metablock-table tbody:nth-child(2) tr").removeClass("highlightedBlockRow");
                            $(this).addClass("highlightedBlockRow");
                            var rowIndex = $(this).index();
                            trashDialog.data("selectedBlockOrMetablock", data[1][rowIndex]);
                            trashDialog.data("selectedTypeOfBlock", "metablock");
                        });

                        trashDialog.find(".spinner-2").hide();
                    }
                });
            }
        });
        function trashDialog_SubmitData() {
            if (trashDialog.data("selectedBlockOrMetablock")) {
                trashDialog.dialog("close");
                if (ChangedSinceLastSave)
                    confirmed = confirm("You have unsaved changes. Do you really want to discard unsaved changes?");
                else
                    confirmed = true;
                if (confirmed) {
                    // Draw block or metablock as user chose
                    if (trashDialog.data("selectedTypeOfBlock") == "block") {
                        currentBlockData = trashDialog.data("selectedBlockOrMetablock");
                        newBlock = $('<div class="block" id="block' + currentBlockData.Id + '" isInitial="' + currentBlockData.IsInitial + '" style="left: '
                            + currentBlockData.PositionX + 'px; top: ' + currentBlockData.PositionY + 'px;" blockId="'
                            + currentBlockData.Id + '" tableId="' + currentBlockData.AssociatedTableId + '"><div class="blockName">'
                            + currentBlockData.Name + '</div><div class="blockInfo">'
                            + (currentBlockData.IsInitial ? 'Initial' : '') + '</div></div>');
                        newBlock.data("IsInMenu", currentBlockData.IsInMenu);
                        $("#overviewPanel .scrollArea").append(newBlock);
                        instance.draggable(newBlock, {
                            containment: "parent",
                            stop: function () {
                                ChangedSinceLastSave = true;
                            }
                        });
                        newBlock.on("dblclick", function () {
                            blockToOpen = $(this);
                            SaveMetablock(function () {
                                openBlockForm = $("#openBlockForm");
                                openBlockForm.find("input[name='blockId']").val(blockToOpen.attr("blockId"));
                                openBlockForm.submit();
                            });
                        });

                        SaveMetablock();
                    } else {
                        currentMetablockData = trashDialog.data("selectedBlockOrMetablock");
                        newMetablock = $('<div class="metablock" id="metablock' + currentMetablockData.Id + '" isInitial="' + currentMetablockData.IsInitial + '"style="left: '
                        + currentMetablockData.PositionX + 'px; top: ' + currentMetablockData.PositionY + 'px;" metablockId="' +
                        currentMetablockData.Id + '"><div class="metablockName">' + currentMetablockData.Name +
                        '</div><div class="metablockSymbol fa fa-th-large"></div><div class="metablockInfo">'
                        + (currentMetablockData.IsInitial ? 'Initial' : '') + '</div></div>');
                        newMetablock.data("IsInMenu", currentMetablockData.IsInMenu);
                        $("#overviewPanel .scrollArea").append(newMetablock);
                        instance.draggable(newMetablock, {
                            containment: "parent",
                            stop: function () {
                                ChangedSinceLastSave = true;
                            }
                        });

                        newMetablock.on("dblclick", function () {
                            metablockToOpen = $(this);
                            SaveMetablock(function () {
                                openMetablockForm = $("#openMetablockForm");
                                openMetablockForm.find("input[name='metablockId']").val(metablockToOpen.attr("metablockId"));
                                openMetablockForm.submit();
                            });
                        });

                        SaveMetablock();
                    }             
                }
            }
            else
                alert("Please select a block");
        }
        renameMetablockDialog = $("#rename-metablock-dialog").dialog({
            autoOpen: false,
            width: 400,
            height: 190,
            buttons: {
                "Save": function () {
                    renameMetablockDialog_SubmitData();
                },
                Cancel: function () {
                    renameMetablockDialog.dialog("close");
                }
            },
            create: function () {
                $(this).keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        renameMetablockDialog_SubmitData();
                        return false;
                    }
                })
            },
            open: function () {
                renameMetablockDialog.find("#metablock-name").val($("#headerMetablockName").text());
            }
        });
        function renameMetablockDialog_SubmitData() {
            renameMetablockDialog.dialog("close");
            $("#headerMetablockName").text(renameMetablockDialog.find("#metablock-name").val());
            ChangedSinceLastSave = true;
        }

        blockPropertiesDialog = $('#block-properties-dialog').dialog({
            autoOpen: false,
            width: 500,
            height: 250,
            buttons: {
                "Save": function () {
                    blockPropertiesDialog_SubmitData();
                },
                "Cancel": function () {
                    blockPropertiesDialog.dialog("close");
                }
            },
            create: function () {
                $(this).keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        blockPropertiesDialog_SubmitData();
                        return false;
                    }
                });
            },
            open: function () {
                blockPropertiesDialog.find("#p-block-name").val(currentBlock.find('.blockName').text());
                blockPropertiesDialog.find("#block-is-in-menu").prop('checked', currentBlock.data('IsInMenu'));
                blockPropertiesDialog.find("#block-set-as-initial").prop('checked', currentBlock.attr('isinitial') == 'true');
            }
        });
        function blockPropertiesDialog_SubmitData() {
            blockPropertiesDialog.dialog("close");
            currentBlock.data("IsInMenu", blockPropertiesDialog.find("#block-is-in-menu").is(':checked'));
            
            var isInitial = blockPropertiesDialog.find("#block-set-as-initial").is(':checked') ? true : false;
            if (isInitial) {
                $("#overviewPanel .block").each(function (index, element) {
                    $(element).attr("isInitial", false);
                    $(element).find(".blockInfo").text("");
                });
            }
            currentBlock.attr("isInitial", isInitial);
            currentBlock.find(".blockInfo").text(isInitial ? "Initial" : "");

            if (blockPropertiesDialog.find("#p-block-name").val().length) {
                currentBlock.find('.blockName').html(blockPropertiesDialog.find("#p-block-name").val());
            }
            ChangedSinceLastSave = true;
        }

        metablockPropertiesDialog = $('#metablock-properties-dialog').dialog({
            autoOpen: false,
            width: 500,
            height: 250,
            buttons: {
                "Save": function () {
                    metablockPropertiesDialog_SubmitData();
                },
                "Cancel": function () {
                    metablockPropertiesDialog.dialog("close");
                }
            },
            create: function () {
                $(this).keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        metablockPropertiesDialog_SubmitData();
                        return false;
                    }
                });
            },
            open: function () {
                metablockPropertiesDialog.find("#p-metablock-name").val(currentMetablock.find('.metablockName').text());
                metablockPropertiesDialog.find("#metablock-is-in-menu").prop('checked', currentMetablock.data('IsInMenu'));
                metablockPropertiesDialog.find("#metablock-set-as-initial").prop('checked', currentMetablock.attr('isinitial') == 'true');
            }
        });
        function metablockPropertiesDialog_SubmitData() {
            metablockPropertiesDialog.dialog("close");

            var isInitial = metablockPropertiesDialog.find("#metablock-set-as-initial").is(':checked') ? true : false;
            if(isInitial)
            {
                $("#overviewPanel .metablock").each(function (index, element) {
                    $(element).attr("isInitial", false);
                    $(element).find(".metablockInfo").text("");
                });
            }
            currentMetablock.attr("isInitial", isInitial);
            currentMetablock.find(".metablockInfo").text(isInitial ? "Initial" : "");

            currentMetablock.data("IsInMenu", metablockPropertiesDialog.find("#metablock-is-in-menu").is(':checked'));
            if (metablockPropertiesDialog.find("#p-metablock-name").val().length) {
                currentMetablock.find('.metablockName').html(metablockPropertiesDialog.find("#p-metablock-name").val());
            }
            ChangedSinceLastSave = true;
        }
    }
});

$(function () {
    if (CurrentModuleIs("nexusModule")) {
        if ($("#ldapMenuArea").length) {
            $("#nexusMenuLDAP").addClass("highlighted");
        }
        else if ($("#wsMenuArea").length) {
            $("#nexusMenuWebServices").addClass("highlighted");
        }
        else if ($("#extDbMenuArea").length) {
            $("#nexusMenuExtDB").addClass("highlighted");
        }
        else if ($("#webDavMenuArea").length) {
            $("#nexusMenuWebDav").addClass("highlighted");
        }
    }
});
function ShowWsdlButtonClick(button) {
    encodedString = $(button).parents("td").find(".wsdlFileString").text();
    CurrentWsdlFile = $("<div/>").html(encodedString).text();
    showWsdlDialog.dialog("open");
};

var CurrentWsdlFile;
$(function () {
    if (CurrentModuleIs("nexusModule")) {
        showWsdlDialog = $("#show-wsdl-dialog").dialog({
            autoOpen: false,
            resizable: false,
            width: 800,
            height: 600,
            buttons: {
                "Zavřít": function () {
                    showWsdlDialog.dialog("close");
                }
            },
            open: function () {
                $(this).find("#wsdlFileText").text(CurrentWsdlFile);
            }
        });
    }
});

function RecalculateMozaicToolboxHeight() {
    var leftBar = $("#mozaicLeftBar");
    var leftBarMinimized = $("#mozaicLeftBarMinimized");
    var scrollTop = $(window).scrollTop();
    var lowerPanelTop = $("#lowerPanel").offset().top;
    var topBarHeight = $("#topBar").height() + $("#appNotificationArea").height();
    var bottomPanelHeight;
    if (scrollTop > lowerPanelTop - topBarHeight) {
        bottomPanelHeight = window.innerHeight - topBarHeight;
    } else {
        bottomPanelHeight = $(window).height() + scrollTop - lowerPanelTop - leftBar.position().top;
    }
    leftBar.height(bottomPanelHeight);
    $("#lowerPanelSpinnerOverlay").height(bottomPanelHeight);
    leftBarMinimized.height($(window).height() + scrollTop - lowerPanelTop - leftBarMinimized.position().top);
}
function CreateDroppableMozaicContainer(target, allowNesting) {
    target.droppable({
        containment: "parent",
        tolerance: "fit",
        accept: ".toolboxItem",
        greedy: true,
        accept: function (element) {
            if (!element.hasClass("toolboxItem") || (element.hasClass("panel-component") && !allowNesting))
                return false;
            else return true;
        },
        drop: function (e, ui) {
            droppedElement = ui.helper.clone();
            droppedElement.removeClass("toolboxItem");
            droppedElement.removeClass("ui-draggable-dragging");
            droppedElement.addClass("uic");
            var newDraggable = droppedElement;
            if (!droppedElement.hasClass("radio-control"))
                droppedElement.attr("uicName", "");
            droppedElement.attr("uicStyles", "");
            droppedElement.attr("placeholder", "");
            thisContainer = $(this);
            thisContainer.append(droppedElement);
            if (thisContainer.hasClass("panel-component")) {
                droppedElement.css("left", parseInt(droppedElement.css("left")) - parseInt(thisContainer.css("left")));
                droppedElement.css("top", parseInt(droppedElement.css("top")) - parseInt(thisContainer.css("top")));
            }
            if (droppedElement.hasClass("breadcrumb-navigation")) {
                droppedElement.css("width", "600px");
            }
            else if (droppedElement.hasClass("data-table")) {
                CreateCzechDataTable(droppedElement, droppedElement.hasClass("data-table-simple-mode"));
                droppedElement.css("width", "1000px");
                wrapper = droppedElement.parents(".dataTables_wrapper");
                newDraggable = wrapper;
                wrapper.css("position", "absolute");
                wrapper.css("left", droppedElement.css("left"));
                wrapper.css("top", droppedElement.css("top"));
                droppedElement.css("position", "relative");
                droppedElement.css("left", "0px");
                droppedElement.css("top", "0px");
            }
            else if (droppedElement.hasClass("color-picker")) {
                droppedElement.val("#f00");
                CreateColorPicker(droppedElement);
                newReplacer = target.find(".sp-replacer:last");
                newDraggable = newReplacer;
                newReplacer.css("position", "absolute");
                newReplacer.css("left", droppedElement.css("left"));
                newReplacer.css("top", droppedElement.css("top"));
                droppedElement.removeClass("uic");
                newReplacer.addClass("uic color-picker");
                newReplacer.attr("uicClasses", "color-picker");
            }
            else if (droppedElement.hasClass("wizard-phases")) {
                droppedElement.css("width", "");
            }
            else if(droppedElement.hasClass("bootstrap-row")) {
                droppedElement.css({left: 20, right: 20, width: "auto"});
                CreateDroppableMozaicContainer(droppedElement, false);
            }
            else if (droppedElement.hasClass("panel-component")) {
                droppedElement.css("width", 500);
                droppedElement.css("height", 120);
                CreateDroppableMozaicContainer(droppedElement, false);
            }
            if (GridResolution > 0) {
                newDraggable.css("left", Math.round(newDraggable.position().left / GridResolution) * GridResolution);
                newDraggable.css("top", Math.round(newDraggable.position().top / GridResolution) * GridResolution);
            }
            ui.helper.remove();
            newDraggable.draggable({
                    cancel: false,
                    containment: "parent",
                    drag: function (event, ui) {
                        if (GridResolution > 0) {
                            ui.position.left -= (ui.position.left % GridResolution);
                            ui.position.top -= (ui.position.top % GridResolution);
                        }
                    }
                });
        }
    });
};
WizardPhasesContentTemplate = '<div class="wizard-phases-frame"></div><svg class="phase-background" width="846px" height="84px"><defs>' +
'<linearGradient id="grad-light" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:#dceffa ;stop-opacity:1" />' +
'<stop offset="100%" style="stop-color:#8dceed;stop-opacity:1" /></linearGradient><linearGradient id="grad-blue" x1="0%" y1="0%" x2="0%" y2="100%">' +
'<stop offset="0%" style="stop-color:#0099cc;stop-opacity:1" /><stop offset="100%" style="stop-color:#0066aa;stop-opacity:1" />' +
'</linearGradient></defs><path d="M0 0 L0 88 L 280 88 L324 44 L280 0 Z" fill="url(#grad-blue)" /><path d="M280 88 L324 44 L280 0 L560 0 L604 44 L560 88 Z" fill="url(#grad-light)" />' +
'<path d="M560 0 L604 44 L560 88 L850 88 L850 0 Z" fill="url(#grad-light)" /></svg><div class="phase phase1 phase-active"><div class="phase-icon-circle">' +
'<div class="phase-icon-number">1</div></div><div class="phase-label">Fáze 1</div></div><div class="phase phase2"><div class="phase-icon-circle">' +
'<div class="phase-icon-number">2</div></div><div class="phase-label">Fáze 2</div></div><div class="phase phase3"><div class="phase-icon-circle">' +
'<div class="phase-icon-number">3</div></div><div class="phase-label">Fáze 3</div></div>';

function SaveMozaicPage() {
    pageSpinner.show();
    SaveRequested = false;
    componentArray = GetMozaicContainerComponentArray($("#mozaicPageContainer"), false);
    postData = {
        Name: $("#headerPageName").text(),
        IsModal: $("#currentPageIsModal").prop("checked"),
        ModalWidth: $("#modalWidthInput").val(),
        ModalHeight: $("#modalHeightInput").val(),
        Components: componentArray
    }
    appId = $("#currentAppId").val();
    pageId = $("#currentPageId").val();
    $.ajax({
        type: "POST",
        url: "/api/mozaic-editor/apps/" + appId + "/pages/" + pageId,
        data: postData,
        complete: function () {
            pageSpinner.hide();
        },
        success: function () { alert("OK") },
        error: function (request, status, error) {
            alert(request.responseText);
        }
    });
}
function GetMozaicContainerComponentArray(container, nested) {
    if (nested)
        componentArrayLevel2 = [];
    else
        componentArrayLevel1 = [];
    container.find(".uic").each(function (uicIndex, uicElement) {
        currentUic = $(uicElement);
        if (!nested && currentUic.parents(".panel-component").length > 0)
            return true;
        tag = null;
        label = null;
        content = null;
        if (currentUic.hasClass("button-simple") || currentUic.hasClass("button-dropdown")) {
            label = currentUic.text();
        }
        else if (currentUic.hasClass("info-container")) {
            label = currentUic.find(".info-container-header").text();
            content = currentUic.find(".info-container-body").text();
        }
        if (currentUic.hasClass("info-container"))
            type = "info-container";
        else if (currentUic.hasClass("breadcrumb-navigation"))
            type = "breadcrumb";
        else if (currentUic.hasClass("button-simple"))
            type = "button-simple";
        else if (currentUic.hasClass("button-dropdown"))
            type = "button-dropdown";
        else if (currentUic.hasClass("button-browse"))
            type = "button-browse";
        else if (currentUic.hasClass("checkbox-control")) {
            type = "checkbox";
            label = currentUic.find(".checkbox-label").text();
        }
        else if (currentUic.hasClass("radio-control")) {
            type = "radio";
            label = currentUic.find(".radio-label").text();
        }
        else if (currentUic.hasClass("form-heading") || currentUic.hasClass("control-label")) {
            label = currentUic.html();
            content = currentUic.attr("contentTemplate");
            type = "label";
        }
        else if (currentUic.hasClass("input-single-line"))
            type = "input-single-line";
        else if (currentUic.hasClass("input-multiline"))
            type = "input-multiline";
        else if (currentUic.hasClass("dropdown-select"))
            type = "dropdown-select";
        else if (currentUic.hasClass("multiple-select"))
            type = "multiple-select";
        else if (currentUic.hasClass("data-table-with-actions"))
            type = "data-table-with-actions";
        else if (currentUic.hasClass("data-table"))
            type = "data-table-read-only";
        else if (currentUic.hasClass("name-value-list"))
            type = "name-value-list";
        else if (currentUic.hasClass("tab-navigation")) {
            type = "tab-navigation";
            tabString = "";
            currentUic.find("li").each(function (index, element) {
                if (index > 0)
                    tabString += $(element).find("a").text() + ";";
            });
            content = tabString;
        }
        else if (currentUic.hasClass("color-picker"))
            type = "color-picker";
        else if (currentUic.hasClass("countdown-component"))
            type = "countdown";
        else if (currentUic.hasClass("wizard-phases")) {
            type = "wizard-phases";
            var phaseLabels = "";
            currentUic.find(".phase-label").each(function (index, element) {
                phaseLabels += $(element).text() + ";";
            });
            phaseLabels = phaseLabels.slice(0, -1);
            content = phaseLabels;
        }
        else if (currentUic.hasClass("named-panel")) {
            type = "panel";
            label = currentUic.find(".named-panel-header").text();
        }
        else if (currentUic.hasClass("panel-component"))
            type = "panel";
        else
            type = "control";
        if (currentUic.hasClass("data-table")) {
            wrapper = currentUic.parents("");
            positionX = wrapper.css("left");
            positionY = wrapper.css("top");
        }
        else {
            positionX = currentUic.css("left");
            positionY = currentUic.css("top");
        }
        if (currentUic.hasClass("color-picker"))
            tag = "input";
        else
            tag = currentUic.prop("tagName").toLowerCase();
        name = currentUic.attr("uicName");
        if (!name || name == "")
            name = type + uicIndex;
        componentData = {
            Name: name,
            Type: type,
            PositionX: positionX,
            PositionY: positionY,
            Width: currentUic.css("width"),
            Height: currentUic.css("height"),
            Tag: tag,
            Attributes: "",
            Classes: currentUic.attr("uicClasses"),
            Styles: currentUic.attr("uicStyles"),
            Properties: currentUic.attr("uicProperties") ? currentUic.attr("uicProperties") : "",
            Content: content,
            Label: label,
            Placeholder: currentUic.attr("placeholder"),
            TabIndex: currentUic.attr("tabindex"),
            ChildComponents: currentUic.hasClass("panel-component") ? GetMozaicContainerComponentArray(currentUic, true) : []
        };
        if (nested)
            componentArrayLevel2.push(componentData);
        else
            componentArrayLevel1.push(componentData);
    });
    if (nested)
        return componentArrayLevel2;
    else
        return componentArrayLevel1;
}
function LoadMozaicPage(pageId) {
    pageSpinner.show();
    appId = $("#currentAppId").val();
    if (pageId == "current")
        pageId = $("#currentPageId").val();
    url = "/api/mozaic-editor/apps/" + appId + "/pages/" + pageId;
    $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        complete: function () {
            pageSpinner.hide()
        },
        error: function (request, status, error) {
            alert(request.responseText);
        },
        success: function (data) {
            $("#mozaicPageContainer .uic").remove();
            $("#mozaicPageContainer .dataTables_wrapper").remove();
            $("#mozaicPageContainer .color-picker").remove();

            for (i = 0; i < data.Components.length; i++) {
                LoadMozaicEditorComponents($("#mozaicPageContainer"), data.Components[i]);
            }
            $("#currentPageId").val(data.Id);
            $("#headerPageName").text(data.Name);
            $("#currentPageIsModal").prop("checked", data.IsModal);
            $("#modalWidthInput").val(data.ModalWidth);
            $("#modalHeightInput").val(data.ModalHeight);
            if ($("#currentPageIsModal").is(":checked")) {
                $("#modalSizeVisualization").css("width", parseInt($("#modalWidthInput").val()));
                $("#modalSizeVisualization").css("height", parseInt($("#modalHeightInput").val()));
                $("#modalSizeVisualization").show();
            }

            var panels = $(".mozaicEditorAbsolute, .mozaicEditorBootstrap").removeClass("mozaicEditorAbsolute mozaicEditorBootstrap");
            switch (data.version) {
                case "0":
                default:
                    panels.addClass("mozaicEditorAbsolute");
                    break;
                case "1":
                    panels.addClass("mozaicEditorBootstrap");
                    break;
            }
        }
    });
}
function LoadMozaicEditorComponents(targetContainer, cData) {
    newComponent = $('<' + cData.Tag + ' id="' + cData.Id + '" uicName="' + cData.Name + '" ' + cData.Attributes + ' class="uic ' + cData.Classes
                    + '" uicClasses="' + cData.Classes + '" uicStyles="' + cData.Styles + '" style="left: ' + cData.PositionX + '; top: ' + cData.PositionY + '; width: '
                    + cData.Width + '; height: ' + cData.Height + '; ' + cData.Styles + '"></' + cData.Tag + '>');
    targetContainer.append(newComponent);
    if (cData.Placeholder)
        newComponent.attr("placeholder", cData.Placeholder);
    if (cData.TabIndex)
        newComponent.attr("tabindex", cData.TabIndex);
    if (cData.Properties)
        newComponent.attr("uicProperties", cData.Properties);
    if (newComponent.hasClass("button-simple"))
        newComponent.text(cData.Label);
    else if (newComponent.hasClass("button-dropdown"))
        newComponent.html(cData.Label + '<i class="fa fa-caret-down"></i>');
    else if (newComponent.hasClass("info-container")) {
        newComponent.append($('<div class="fa fa-info-circle info-container-icon"></div>'
            + '<div class="info-container-header"></div>'
            + '<div class="info-container-body"></div>'));
        newComponent.find(".info-container-header").text(cData.Label);
        newComponent.find(".info-container-body").text(cData.Content);
    }
    else if (newComponent.hasClass("named-panel")) {
        newComponent.append($('<div class="named-panel-header"></div>'));
        newComponent.find(".named-panel-header").text(cData.Label);
    }
    else if (newComponent.hasClass("multiple-select")) {
        newComponent.append($('<option value="1">Multiple</option><option value="2">Choice</option><option value="3">Select</option>'));
        newComponent.attr("multiple", "");
    }
    else if (newComponent.hasClass("button-browse")) {
        newComponent.attr("type", "file");
    }
    else if (newComponent.hasClass("form-heading") || newComponent.hasClass("control-label")) {
        newComponent.html(cData.Label);
        newComponent.attr("contentTemplate", cData.Content);
    }
    else if (newComponent.hasClass("checkbox-control")) {
        newComponent.append($('<input type="checkbox" /><span class="checkbox-label">' + cData.Label + '</span>'));
    }
    else if (newComponent.hasClass("radio-control")) {
        newComponent.append($('<input type="radio" name="' + cData.Name + '" /><span class="radio-label">' + cData.Label + '</span>'));
    }
    else if (newComponent.hasClass("breadcrumb-navigation")) {
        newComponent.append($('<div class="app-icon fa fa-question"></div><div class="nav-text">APP NAME &gt; Nav</div>'));
    }
    else if (newComponent.hasClass("data-table")) {
        newComponent.append($('<thead><tr><th>Column 1</th><th>Column 2</th><th>Column 3</th></tr></thead>'
            + '<tbody><tr><td>Value1</td><td>Value2</td><td>Value3</td></tr><tr><td>Value4</td><td>Value5</td><td>Value6</td></tr>'
            + '<tr><td>Value7</td><td>Value8</td><td>Value9</td></tr></tbody>'));
        CreateCzechDataTable(newComponent, newComponent.hasClass("data-table-simple-mode"));
        newComponent.css("width", cData.Width);
        wrapper = newComponent.parents(".dataTables_wrapper");
        wrapper.css("position", "absolute");
        wrapper.css("left", cData.PositionX);
        wrapper.css("top", cData.PositionY);
        newComponent.css("position", "relative");
        newComponent.css("left", "0px");
        newComponent.css("top", "0px");
    }
    else if (newComponent.hasClass("name-value-list")) {
        newComponent.append($('<tr><td class="name-cell">Platform</td><td class="value-cell">Omnius</td></tr><tr><td class="name-cell">Country</td>'
            + '<td class="value-cell">Czech Republic</td></tr><tr><td class="name-cell">Year</td><td class="value-cell">2016</td></tr>'));
    }
    else if (newComponent.hasClass("tab-navigation")) {
        tabLabelArray = cData.Content.split(";");
        newComponent.append($('<li class="active"><a class="fa fa-home"></a></li>'));
        for (k = 0; k < tabLabelArray.length; k++) {
            if (tabLabelArray[k].length > 0)
                newComponent.append($("<li><a>" + tabLabelArray[k] + "</a></li>"));
        }
        newComponent.css("width", "auto");
    }
    else if (newComponent.hasClass("color-picker")) {
        CreateColorPicker(newComponent);
        newReplacer = targetContainer.find(".sp-replacer:last");
        newReplacer.css("position", "absolute");
        newReplacer.css("left", newComponent.css("left"));
        newReplacer.css("top", newComponent.css("top"));
        newComponent.removeClass("uic");
        newReplacer.addClass("uic color-picker");
        newReplacer.attr("uicClasses", "color-picker");
        newReplacer.attr("uicName", newComponent.attr("uicName"));
    }
    else if (newComponent.hasClass("countdown-component")) {
        newComponent.html('<span class="countdown-row countdown-show3"><span class="countdown-section"><span class="countdown-amount">0</span>'
            + '<span class="countdown-period">Hodin</span></span><span class="countdown-section"><span class="countdown-amount">29</span>'
            + '<span class="countdown-period">Minut</span></span><span class="countdown-section"><span class="countdown-amount">59</span>'
            + '<span class="countdown-period">Sekund</span></span></span>');
    }
    else if (newComponent.hasClass("wizard-phases")) {
        newComponent.html(WizardPhasesContentTemplate);
        var phaseLabelArray = cData.Content.split(";");
        newComponent.find(".phase1 .phase-label").text(phaseLabelArray[0] ? phaseLabelArray[0] : "Fáze 1");
        newComponent.find(".phase2 .phase-label").text(phaseLabelArray[1] ? phaseLabelArray[1] : "Fáze 2");
        newComponent.find(".phase3 .phase-label").text(phaseLabelArray[2] ? phaseLabelArray[2] : "Fáze 3");
    }
    else if (newComponent.hasClass("panel-component")) {
        CreateDroppableMozaicContainer(newComponent, false);
    }
    if (newComponent.hasClass("data-table"))
        draggableElement = wrapper;
    else if (newComponent.hasClass("color-picker"))
        draggableElement = newReplacer;
    else
        draggableElement = newComponent;
    draggableElement.draggable({
        cancel: false,
        containment: "parent",
        drag: function (event, ui) {
            if (GridResolution > 0) {
                ui.position.left -= (ui.position.left % GridResolution);
                ui.position.top -= (ui.position.top % GridResolution);
            }
        }
    });
    if (cData.ChildComponents) {
        currentPanel = newComponent;
        for (j = 0; j < cData.ChildComponents.length; j++) {
            LoadMozaicEditorComponents(currentPanel, cData.ChildComponents[j]);
        }
    }
}

var GridResolution = 0;
$(function () {
    if (CurrentModuleIs("mozaicEditorModule")) {
        RecalculateMozaicToolboxHeight();
        pageId = $("#currentPageId").val();
        if (pageId)
            LoadMozaicPage(pageId);

        $("#headerPageName").on("click", function () {
            renamePageDialog.dialog("open");
        });
        $("#btnNewPage").on("click", function () {
            newPageDialog.dialog("open");
        });
        $("#btnChoosePage").on("click", function () {
            choosePageDialog.dialog("open");
        });
        $("#btnClear").on("click", function () {
            $("#mozaicPageContainer .uic").remove();
            $("#mozaicPageContainer .dataTables_wrapper").remove();
            $("#mozaicPageContainer .color-picker").remove();
        });
        $("#btnSave").on("click", function () {
            pageId = $("#currentPageId").val();
            if (pageId == 0) {
                SaveRequested = true;
                newPageDialog.dialog("open");
            }
            else
                SaveMozaicPage();
        });
        $("#btnLoad").on("click", function () {
            LoadMozaicPage("current");
        });
        $("#btnTrashPage").on("click", function () {
            trashPageDialog.dialog("open");
        });
        $("#btnToBootstrap").on("click", function() {
            $(".mozaicEditorAbsolute").removeClass("mozaicEditorAbsolute").addClass("mozaicEditorBootstrap");
            RecalculateMozaicToolboxHeight();
            convertAbsoluteToBootstrap();
        });
        $("#hideMozaicTooboxIcon").on("click", function () {
            $("#mozaicLeftBar").hide();
            $("#mozaicLeftBarMinimized").show();
            $("#mozaicPageContainer").css("left", 32);
            RecalculateMozaicToolboxHeight();
        });
        $("#showMozaicTooboxIcon").on("click", function () {
            $("#mozaicLeftBar").show();
            $("#mozaicLeftBarMinimized").hide();
            $("#mozaicPageContainer").css("left", 300);
            RecalculateMozaicToolboxHeight();
        });
        $("#gridShowCheckbox").prop("checked", false);
        $("#gridResolutionDropdown").val("off");
        $("#gridShowCheckbox").on("change", function () {
            if ($(this).is(":checked")) {
                grid = $("#gridResolutionDropdown").val();
                if (grid != "off") {
                    resolutionValue = parseInt(grid);
                    $("#mozaicPageContainer").addClass("showGrid");
                    $("#mozaicPageContainer").css("background-size", resolutionValue);
                }
            }
            else {
                $("#mozaicPageContainer").removeClass("showGrid");
            }
        });
        if ($("#currentPageIsModal").is(":checked")) {
            $("#modalSizeVisualization").css("width", parseInt($("#modalWidthInput").val()));
            $("#modalSizeVisualization").css("height", parseInt($("#modalHeightInput").val()));
            $("#modalSizeVisualization").show();
        }
        $("#currentPageIsModal").on("change", function () {
            if ($(this).is(":checked")) {
                $("#modalSizeVisualization").css("width", parseInt($("#modalWidthInput").val()));
                $("#modalSizeVisualization").css("height", parseInt($("#modalHeightInput").val()));
                $("#modalSizeVisualization").show();
            }
            else {
                $("#modalSizeVisualization").hide();
            }
        });
        $("#modalWidthInput").on("change", function () {
            $("#modalSizeVisualization").css("width", parseInt($("#modalWidthInput").val()));
        });
        $("#modalHeightInput").on("change", function () {
            $("#modalSizeVisualization").css("height", parseInt($("#modalHeightInput").val()));
        });
        $("#gridResolutionDropdown").on("change", function () {
            grid = $(this).val();
            if (grid == "off") {
                $("#mozaicPageContainer").removeClass("showGrid");
                $("#gridShowCheckbox").prop("checked", false);
                GridResolution = 0;
            }
            else {
                resolutionValue = parseInt(grid);
                GridResolution = resolutionValue;
                if ($("#gridShowCheckbox").is(":checked")) {
                    $("#mozaicPageContainer").addClass("showGrid");
                    $("#mozaicPageContainer").css("background-size", resolutionValue);
                }
            }
        });
        $("#mozaicContainer button").off("click");
        $("#mozaicLeftBar .toolboxItem").draggable({
            helper: "clone",
            appendTo: '#mozaicPageContainer',
            containment: 'window',
            revert: true,
            scroll: true,
            cancel: false
        });
        CreateDroppableMozaicContainer($("#mozaicPageContainer"), true);
        $("#mozaicPageContainer .uic").draggable({
            cancel: false,
            containment: "parent",
            drag: function (event, ui) {
                if (GridResolution > 0) {
                    ui.position.left = Math.round(ui.position.left / GridResolution) * GridResolution;
                    ui.position.top = Math.round(ui.position.top / GridResolution) * GridResolution;
                }
            }
        });
        $.contextMenu({
            selector: '.uic',
            trigger: 'right',
            zIndex: 300,
            callback: function (key, options) {
                item = options.$trigger;
                if (key == "delete") {
                    if (item.hasClass("data-table"))
                        item.parents(".dataTables_wrapper").remove();
                    else
                        item.remove();
                }
                else if (key == "properties") {
                    CurrentComponent = item;
                    componentPropertiesDialog.dialog("open");
                }
            },
            items: {
                "properties": { name: "Properties", icon: "edit" },
                "delete": { name: "Delete", icon: "delete" }
            }
        });
        $(window).scroll(function () {
            var leftBar = $("#mozaicLeftBar");
            var scrollTop = $(window).scrollTop();
            var lowerPanelTop = $("#lowerPanel").offset().top;
            var topBarHeight = $("#topBar").height() + $("#appNotificationArea").height();
            var overlay = $("#lowerPanelSpinnerOverlay");

            overlay.css({ right: 0, width: 'auto' });
            if (scrollTop > lowerPanelTop - topBarHeight) {
                leftBar.css({ top: topBarHeight, left: 225, position: "fixed" });
                overlay.css({ top: topBarHeight, left: 225, position: "fixed" });
            } else {
                leftBar.css({ top: 0, left: 0, position: "absolute" });
                overlay.css({ top: 0, left: 0, position: "absolute" });
            }
            RecalculateMozaicToolboxHeight();
        });
        $(window).resize(function () {
            RecalculateMozaicToolboxHeight();
        });

        function convertAbsoluteToBootstrap() {

        }

    } else if (CurrentModuleIs("mozaicComponentManagerModule")) {
        $(window).on("scroll resize", function () {
            var scrollTop = $(window).scrollTop();
            var upperPanelBottom = $("#upperPanel").offset().top + $("#upperPanel").height();
            var overlay = $("#lowerPanelSpinnerOverlay");
            overlay.css({ left: 225, top: 0, right: 0, width: "auto" });
            if (scrollTop > upperPanelBottom) {
                overlay.css({ top: 0, position: "fixed" });
                overlay.css({ height: window.innerHeight });
            } else {
                overlay.css({ top: upperPanelBottom + 1, position: "absolute" });
                overlay.css({ height: window.innerHeight - upperPanelBottom + scrollTop - 20 });
            }
        })
    }

});

var CurrentComponent, SaveRequested = false;
$(function () {
    if (CurrentModuleIs("mozaicEditorModule")) {
        componentPropertiesDialog = $("#component-properties-dialog").dialog({
            autoOpen: false,
            width: 700,
            height: 'auto',
            buttons: {
                "Save": function () {
                    componentPropertiesDialog_SubmitData();
                },
                Cancel: function () {
                    componentPropertiesDialog.dialog("close");
                }
            },
            create: function () {
                $(this).keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        componentPropertiesDialog_SubmitData();
                        return false;
                    }
                })
            },
            open: function () {
                componentPropertiesDialog.find("#component-name").val(CurrentComponent.attr("uicName"));
                componentPropertiesDialog.find("#component-width").val(CurrentComponent.css("width"));
                componentPropertiesDialog.find("#component-height").val(CurrentComponent.css("height"));            
                componentPropertiesDialog.find("#component-styles").val(CurrentComponent.attr("uicStyles"));
                componentPropertiesDialog.find("#component-props").val(CurrentComponent.attr("uicProperties"));
                componentPropertiesDialog.find("#component-tabindex").val(CurrentComponent.attr("tabindex"));
                // Show table row for relevant attributes by default
                componentPropertiesDialog.find("#component-placeholder").parents('tr').show();
                componentPropertiesDialog.find("#component-tabindex").parents('tr').show();
                componentPropertiesDialog.find("#component-label").parents('tr').show();
                if (CurrentComponent.hasClass("input-single-line") || CurrentComponent.hasClass("input-multiline")) {
                    componentPropertiesDialog.find("#component-placeholder").val(CurrentComponent.attr("placeholder"));
                    componentPropertiesDialog.find("#component-label").parents('tr').hide();
                }
                else if (CurrentComponent.hasClass("info-container")) {
                    componentPropertiesDialog.find("#component-label").val(CurrentComponent.find(".info-container-header").text());
                    componentPropertiesDialog.find("#component-content").val(CurrentComponent.find(".info-container-body").text());
                    componentPropertiesDialog.find("#component-placeholder").parents('tr').hide();
                    componentPropertiesDialog.find("#component-tabindex").parents('tr').hide();
                }
                else if (CurrentComponent.hasClass("named-panel")) {
                    componentPropertiesDialog.find("#component-label").val(CurrentComponent.find(".named-panel-header").text());
                }
                else if (CurrentComponent.hasClass("form-heading") || CurrentComponent.hasClass("control-label")) {
                    componentPropertiesDialog.find("#component-label").val(CurrentComponent.html());
                    componentPropertiesDialog.find("#component-content").val(CurrentComponent.attr("contentTemplate"));
                    componentPropertiesDialog.find("#component-placeholder").parents('tr').hide();
                    componentPropertiesDialog.find("#component-tabindex").parents('tr').hide();
                }
                else if (CurrentComponent.hasClass("checkbox-control")) {
                    componentPropertiesDialog.find("#component-label").val(CurrentComponent.find(".checkbox-label").text());
                    componentPropertiesDialog.find("#component-content").val("");
                    componentPropertiesDialog.find("#component-placeholder").parents('tr').hide();
                }
                else if (CurrentComponent.hasClass("radio-control")) {
                    componentPropertiesDialog.find("#component-label").val(CurrentComponent.find(".radio-label").text());
                    componentPropertiesDialog.find("#component-content").val("");
                    componentPropertiesDialog.find("#component-placeholder").parents('tr').hide();
                }
                else if (CurrentComponent.hasClass("tab-navigation")) {
                    componentPropertiesDialog.find("#component-label").val("");
                    tabString = "";
                    CurrentComponent.find("li").each(function (index, element) {
                        if (index > 0)
                            tabString += $(element).find("a").text() + ";";
                    });
                    componentPropertiesDialog.find("#component-content").val(tabString);
                    componentPropertiesDialog.find("#component-placeholder").parents('tr').hide();
                    componentPropertiesDialog.find("#component-label").parents('tr').hide();
                }
                else if (CurrentComponent.hasClass("wizard-phases")) {
                    componentPropertiesDialog.find("#component-label").val("");
                    var phaseLabels = "";
                    CurrentComponent.find(".phase-label").each(function (index, element) {
                        phaseLabels += $(element).text() + ";";
                    });
                    phaseLabels = phaseLabels.slice(0, -1);
                    componentPropertiesDialog.find("#component-content").val(phaseLabels);
                    componentPropertiesDialog.find("#component-placeholder").parents('tr').hide();
                    componentPropertiesDialog.find("#component-label").parents('tr').hide();
                }
                else if (CurrentComponent.hasClass("button-simple") || CurrentComponent.hasClass("button-dropdown")) {
                    componentPropertiesDialog.find("#component-label").val(CurrentComponent.text());
                    componentPropertiesDialog.find("#component-placeholder").parents('tr').hide();
                }
                else if (CurrentComponent.hasClass("name-value-list") || CurrentComponent.hasClass("panel-component")
                    || CurrentComponent.hasClass("countdown-component")) {
                    componentPropertiesDialog.find("#component-label").val("");
                    componentPropertiesDialog.find("#component-content").val("");
                    componentPropertiesDialog.find("#component-placeholder").parents('tr').hide();
                    componentPropertiesDialog.find("#component-tabindex").parents('tr').hide();
                }
                else {
                    // Classes: data-dable, color-picker
                    componentPropertiesDialog.find("#component-label").val("");
                    componentPropertiesDialog.find("#component-content").val("");
                    componentPropertiesDialog.find("#component-placeholder").parents('tr').hide();
                }
            }
        });
        function componentPropertiesDialog_SubmitData() {
            CurrentComponent.attr("uicName", componentPropertiesDialog.find("#component-name").val());
            CurrentComponent.css("width", componentPropertiesDialog.find("#component-width").val());
            CurrentComponent.css("height", componentPropertiesDialog.find("#component-height").val());
            CurrentComponent.attr("uicStyles", componentPropertiesDialog.find("#component-styles").val());
            CurrentComponent.attr("uicProperties", componentPropertiesDialog.find("#component-props").val());
            CurrentComponent.attr("tabindex", componentPropertiesDialog.find("#component-tabindex").val());
            if (CurrentComponent.hasClass("button-simple"))
                CurrentComponent.text(componentPropertiesDialog.find("#component-label").val());
            else if (CurrentComponent.hasClass("button-dropdown"))
                CurrentComponent.html(componentPropertiesDialog.find("#component-label").val() + '<i class="fa fa-caret-down">');
            else if (CurrentComponent.hasClass("input-single-line") || CurrentComponent.hasClass("input-multiline"))
                CurrentComponent.attr("placeholder", componentPropertiesDialog.find("#component-placeholder").val());
            else if (CurrentComponent.hasClass("info-container")) {
                CurrentComponent.find(".info-container-header").text(componentPropertiesDialog.find("#component-label").val());
                CurrentComponent.find(".info-container-body").text(componentPropertiesDialog.find("#component-content").val());
            }
            else if (CurrentComponent.hasClass("named-panel")) {
                CurrentComponent.find(".named-panel-header").text(componentPropertiesDialog.find("#component-label").val());
            }
            else if (CurrentComponent.hasClass("form-heading") || CurrentComponent.hasClass("control-label")) {
                CurrentComponent.html(componentPropertiesDialog.find("#component-label").val());
                CurrentComponent.attr("contentTemplate", componentPropertiesDialog.find("#component-content").val());
            }
            else if (CurrentComponent.hasClass("checkbox-control")) {
                CurrentComponent.find(".checkbox-label").text(componentPropertiesDialog.find("#component-label").val());
                CurrentComponent.css("width", "auto");
            }
            else if (CurrentComponent.hasClass("radio-control")) {
                CurrentComponent.find(".radio-label").text(componentPropertiesDialog.find("#component-label").val());
                CurrentComponent.find("input").attr("name", componentPropertiesDialog.find("#component-name").val());
                CurrentComponent.css("width", "auto");
            }
            else if (CurrentComponent.hasClass("tab-navigation")) {
                tabString = componentPropertiesDialog.find("#component-content").val();
                tabLabelArray = tabString.split(";");
                CurrentComponent.find("li").remove();
                CurrentComponent.append($('<li class="active"><a class="fa fa-home"></a></li>'));
                for (i = 0; i < tabLabelArray.length; i++) {
                    if (tabLabelArray[i].length > 0)
                        CurrentComponent.append($("<li><a>" + tabLabelArray[i] + "</a></li>"));
                }
                CurrentComponent.css("width", "auto");
            }
            else if (CurrentComponent.hasClass("wizard-phases")) {
                var phaseLabelArray = componentPropertiesDialog.find("#component-content").val().split(";");
                CurrentComponent.find(".phase1 .phase-label").text(phaseLabelArray[0] ? phaseLabelArray[0] : "Fáze 1");
                CurrentComponent.find(".phase2 .phase-label").text(phaseLabelArray[1] ? phaseLabelArray[1] : "Fáze 2");
                CurrentComponent.find(".phase3 .phase-label").text(phaseLabelArray[2] ? phaseLabelArray[2] : "Fáze 3");
            }
            componentPropertiesDialog.dialog("close");
        }
        renamePageDialog = $("#rename-page-dialog").dialog({
            autoOpen: false,
            width: 400,
            height: 190,
            buttons: {
                "Save": function () {
                    renamePageDialog_SubmitData();
                },
                Cancel: function () {
                    renamePageDialog.dialog("close");
                }
            },
            create: function () {
                $(this).keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        renamePageDialog_SubmitData();
                        return false;
                    }
                })
            },
            open: function () {
                renamePageDialog.find("#page-name").val($("#headerPageName").text());
            }
        });
        function renamePageDialog_SubmitData() {
            renamePageDialog.dialog("close");
            $("#headerPageName").text(renamePageDialog.find("#page-name").val());
            ChangedSinceLastSave = true;
        }
        choosePageDialog = $("#choose-page-dialog").dialog({
            autoOpen: false,
            width: 700,
            height: 540,
            buttons: {
                "Open": function () {
                    historyDialog_SubmitData();
                },
                "Delete": function () {
                    if (confirm('Are you sure you want to delete this page?')) {
                        deleteMozaicPage_SubmitData();
                    }
                },
                Cancel: function () {
                    choosePageDialog.dialog("close");
                }
            },
            open: function (event, ui) {
                choosePageDialog.find("#page-table:first tbody tr").remove();
                $("#choose-page-dialog .spinner-2").show();
                choosePageDialog.data("selectedPageId", null);
                appId = $("#currentAppId").val();
                $.ajax({
                    type: "GET",
                    url: "/api/mozaic-editor/apps/" + appId + "/pages",
                    dataType: "json",
                    error: function (request, status, error) {
                        alert(request.responseText);
                    },
                    success: function (data) {
                        tbody = choosePageDialog.find("#page-table tbody:nth-child(2)");
                        for (i = 0; i < data.length; i++) {
                            tbody.append($('<tr class="pageRow" pageId="' + data[i].Id + '"><td>' + data[i].Name + '</td></tr>'));
                        }
                        $(document).on('click', 'tr.pageRow', function (event) {
                            choosePageDialog.find("#page-table tbody:nth-child(2) tr").removeClass("highlightedRow");
                            $(this).addClass("highlightedRow");
                            choosePageDialog.data("selectedPageId", $(this).attr("pageId"));
                        });
                        $("#choose-page-dialog .spinner-2").hide();
                    }
                });
            }
        });
        function historyDialog_SubmitData() {
            if (choosePageDialog.data("selectedPageId")) {
                choosePageDialog.dialog("close");
                LoadMozaicPage(choosePageDialog.data("selectedPageId"));
            }
            else
                alert("Please select a commit");
        }
        function deleteMozaicPage_SubmitData() {
            pageSpinner.show();
            appId = $("#currentAppId").val();
            pageId = choosePageDialog.data("selectedPageId");
            $.ajax({
                type: "POST",
                url: "/api/mozaic-editor/apps/" + appId + "/pages/" + pageId + "/delete",
                complete: function () {
                    pageSpinner.hide();
                },
                success: function () {
                    alert("OK. Page deleted.");
                    choosePageDialog.dialog("close");
                    // Clear MozaicPageContainer, but only when deleted page is currently opened
                    if ($("#currentPageId").val() == pageId) {
                        $("#mozaicPageContainer .uic").remove();
                        $("#mozaicPageContainer .dataTables_wrapper").remove();
                        $("#mozaicPageContainer .color-picker").remove();
                        $("#headerPageName").remove();
                    }
                },
                error: function (request, status, error) {
                    alert(request.responseText);
                }
            });    
        }
        newPageDialog = $("#new-page-dialog").dialog({
            autoOpen: false,
            width: 400,
            height: 170,
            buttons: {
                "Save": function () {
                    newPageDialog_SubmitData();
                },
                Cancel: function () {
                    newPageDialog.dialog("close");
                }
            },
            create: function () {
                $(this).keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        newPageDialog_SubmitData();
                        return false;
                    }
                })
            },
            open: function () {
                newPageDialog.find("#new-page-name").val("");
            }
        });
        function newPageDialog_SubmitData() {
            pageSpinner.show();
            newPageDialog.dialog("close");
            postData = {
                Name: newPageDialog.find("#new-page-name").val(),
                Components: []
            };
            appId = $("#currentAppId").val();
            newPageName = newPageDialog.find("#new-page-name").val()
            $.ajax({
                type: "POST",
                url: "/api/mozaic-editor/apps/" + appId + "/pages",
                data: postData,
                error: function (request, status, error) {
                    alert(request.responseText);
                },
                success: function (data) {
                    $("#currentPageId").val(data);
                    if (newPageName == "")
                        $("#headerPageName").text("Nepojmenovaná stránka");
                    else
                        $("#headerPageName").text(newPageName);
                    
                    if (SaveRequested) {
                        SaveMozaicPage();
                    }
                    else {
                        pageSpinner.hide();
                    }
                }
            });
        }
        trashPageDialog = $("#trash-page-dialog").dialog({
            autoOpen: false,
            width: 700,
            height: 540,
            buttons: {
                "Load": function () {
                    trashPageDialog_SubmitData();
                },
                Cancel: function () {
                    trashPageDialog.dialog("close");
                }
            },
            open: function (event, ui) {
                trashPageDialog.find("#trash-page-table:first tbody tr").remove();
                $("#trash-page-dialog .spinner-2").show();
                trashPageDialog.data("selectedPageId", null);
                appId = $("#currentAppId").val();
                $.ajax({
                    type: "GET",
                    url: "/api/mozaic-editor/apps/" + appId + "/deletedPages",
                    dataType: "json",
                    error: function (request, status, error) {
                        alert(request.responseText);
                    },
                    success: function (data) {
                        tbody = trashPageDialog.find("#trash-page-table tbody:nth-child(2)");
                        for (i = 0; i < data.length; i++) {
                            tbody.append($('<tr class="pageRow" pageId="' + data[i].Id + '"><td>' + data[i].Name + '</td></tr>'));
                        }
                        $(document).on('click', 'tr.pageRow', function (event) {
                            trashPageDialog.find("#trash-page-table tbody:nth-child(2) tr").removeClass("highlightedRow");
                            $(this).addClass("highlightedRow");
                            trashPageDialog.data("selectedPageId", $(this).attr("pageId"));
                        });
                        $("#trash-page-dialog .spinner-2").hide();
                    }
                });
            }
        });
        function trashPageDialog_SubmitData() {
            if (trashPageDialog.data("selectedPageId")) {
                trashPageDialog.dialog("close");
                LoadMozaicPage(trashPageDialog.data("selectedPageId"));
            }
            else
                alert("Please select a commit");
        }
    }
});

$(function () {
    if (CurrentModuleIs("hermesModule")) {
        if ($("#smtpMenuArea").length) {
            $("#hermesMenuSMTP").addClass("highlighted");
        }
        if ($("#templateMenuArea").length) {
            $("#hermesMenuTemplate").addClass("highlighted");
        }
        if ($("#queueMenuArea").length) {
            $("#hermesMenuQueue").addClass("highlighted");
        }
    }
});

var instance;

jsPlumb.ready(function () {
    if (CurrentModuleIs("dbDesignerModule")) {
        instance = jsPlumb.getInstance({
            Endpoint: ["Blank", {}],
            HoverPaintStyle: { strokeStyle: "#ff4000", lineWidth: 2 },
            ConnectionOverlays: [
                ["Arrow", {
                    location: 1,
                    id: "arrow",
                    length: 14,
                    foldback: 0.8
                }],
            ],
            Container: "database-container"
        });

        instance.bind("click", function (con) {
            CurrentConnection = con;
            editRelationDialog.dialog("open");
        });

        instance.bind("connection", function (info) {
            if ($(info.connection.source).attr("dbColumnType") != $(info.connection.target).attr("dbColumnType")) {
                instance.detach(info.connection);
                alert("These columns have different types. Relation can only be created between columns of the same type.");
                return false;
            }
            info.connection.addClass("relationConnection");
            info.connection.removeOverlay("arrow");
            info.connection.addOverlay(["Arrow", {
                location: 0,
                id: "arrow0",
                length: 8,
                width: 8,
                height: 8,
                foldback: 0.8,
                direction: -1
            }]);
            info.connection.addOverlay(["Arrow", {
                location: 1,
                id: "arrow1",
                length: 8,
                width: 8,
                height: 8,
                foldback: 0.8
            }]);
            info.connection.addOverlay(["Label", {
                location: 0.1,
                id: "label0",
                cssClass: "relationLabel",
                label: "1"
            }]);
            info.connection.addOverlay(["Label", {
                location: 0.9,
                id: "label1",
                cssClass: "relationLabel",
                label: "1"
            }]);
        });

        instance.batch(function () {
            $(".dbTable").each(function (index, element) {
                instance.draggable(element);
            });

            $(".dbColumn").each(function (index, element) {
                AddColumnToJsPlumb(element);
            });
        });
    }
});

function ClearDbScheme() {
    jQuery.each($("#database-container .dbTable"), function (i, val) {
        instance.removeAllEndpoints(val, true);
        val.remove();
    });
    jQuery.each($("#database-container .dbView"), function (i, val) {
        val.remove();
    });
};

function AddColumnToJsPlumb(item) {
    instance.makeSource(item, {
        anchor: ["Continuous", { faces: ["left", "right"] }],
        faces: ["left", "right"],
        container: "database-container",
        connector: ["Bezier", {curviness: 150}],
        connectorStyle: { strokeStyle: "#1092bd", lineWidth: 2, outlineColor: "transparent", outlineWidth: 4 }
    });

    instance.makeTarget(item, {
        dropOptions: { hoverClass: "dragHover" },
        anchor: ["Continuous", { faces: ["left", "right"] }],
        faces: ["left", "right"],
        container: "database-container",
        allowLoopback: false
    });
}

function EditRelation(connection, sourceLabel, targetLabel) {
    connection.removeOverlay("label0");
    connection.removeOverlay("label1");
    connection.addOverlay(["Label", {
        location: 0.1,
        id: "label0",
        cssClass: "relationLabel",
        label: sourceLabel
    }]);
    connection.addOverlay(["Label", {
        location: 0.9,
        id: "label1",
        cssClass: "relationLabel",
        label: targetLabel
    }]);
}

function AddTable(tableName) {
    var tableAllowed = true;
    $("#database-container .dbTable").each(function (tableIndex, tableDiv) {
        if ($(tableDiv).find(".dbTableName").text().toLowerCase() == tableName.toLowerCase()) {
            tableAllowed = false;
            alert("This table name is already used.");
            return false;
        }
       
        var regex = /^[0-9a-zA-Z_]+$/;
        if (!regex.test(tableName)) {
            tableAllowed = false;
            alert("Incorrect table name.");
            return false;
        }    
    });

    if (!tableAllowed) {
        return;
    }

    newTable = $('<div class="dbTable"><div class="dbTableHeader"><div class="deleteTableIcon fa fa-remove"></div><div class="dbTableName">'
        + tableName + '</div><div class="editTableIcon fa fa-pencil"></div><div class="addColumnIcon fa fa-plus"></div></div>'
        + '<div class="dbTableBody"><div class="dbColumn idColumn dbPrimaryKey" dbColumnType="integer">'
        + '<div class="dbColumnName">id</div></div></div>'
        + '<div class="dbTableIndexArea"></div></div>');
    newTable.find(".dbColumn").data("dbColumnType", "integer");
    $("#database-container").append(newTable);
    newTable.find(".editTableIcon").on("click", function () {
        CurrentTable = $(this).parents(".dbTable");
        editTableDialog.dialog("open");
    });
    newTable.find(".deleteTableIcon").on("click", function () {
        $(this).parents(".dbTable").remove();
        instance.removeAllEndpoints($(this).parents(".dbTable"), true);
    });
    newTable.find(".addColumnIcon").on("click", function () {
        addColumnDialog.data("currentTable", $(this).parents(".dbTable"));
        addColumnDialog.dialog("open");
    })
    instance.draggable(newTable);
    AddColumnToJsPlumb(newTable.find(".dbColumn"));
}

function AddColumn(table, columnName, type, isPrimaryKey, allowNull, defaultValue, length, lengthMax, unique, displayName) {
    newColumn = $('<div class="dbColumn"><div class="deleteColumnIcon fa fa-remove"></div><div class="dbColumnName">'
        + columnName + '</div><div class="editColumnIcon fa fa-pencil"></div></div>');

    newColumn.children(".deleteColumnIcon").on("mousedown", function () {
        $(this).parents(".dbColumn").remove();
        instance.removeAllEndpoints($(this).parents(".dbColumn"), true);
        instance.recalculateOffsets();
        instance.repaintEverything();
        return false;
    });
    newColumn.children(".editColumnIcon").on("mousedown", function () {
        CurrentColumn = $(this).parents(".dbColumn");
        editColumnDialog.dialog("open");
        return false;
    });
    table.children(".dbTableBody").append(newColumn);
    if (isPrimaryKey) {
        //table.find(".dbColumn").removeClass("dbPrimaryKey");
        newColumn.addClass("dbPrimaryKey");
    }
    newColumn.data("dbAllowNull", allowNull);
    newColumn.data("dbUnique", unique);
    newColumn.data("dbDefaultValue", defaultValue);
    newColumn.attr("dbColumnType", type);
    newColumn.data("dbColumnLength", length);
    newColumn.data("dbColumnLengthMax", lengthMax);
    newColumn.data("dbColumnDisplayName", displayName);
    AddColumnToJsPlumb(newColumn);
}

function AddIndex(table, name, indexColumnArray, unique) {
    indexLabel = "Index: ";
    for (i = 0; i < indexColumnArray.length - 1; i++)
        indexLabel += indexColumnArray[i] + ", ";
    indexLabel += indexColumnArray[indexColumnArray.length - 1];
    if (unique)
        indexLabel += " - unique";
    newIndex = $('<div class="dbIndex"><div class="deleteIndexIcon fa fa-remove"></div><div class="dbIndexText">' + indexLabel + '</div><div class="editIndexIcon fa fa-pencil"></div></div>');
    newIndex.data("indexName", name);
    filteredIndexColumnArray = [];
    for (i = 0; i < indexColumnArray.length; i++) {
        if (indexColumnArray[i] != "-none-")
            filteredIndexColumnArray.push(indexColumnArray[i]);
    }
    newIndex.data("indexColumnArray", filteredIndexColumnArray);
    newIndex.data("indexColumnArray", indexColumnArray);
    newIndex.data("unique", unique);
    newIndex.children(".deleteIndexIcon").on("mousedown", function () {
        $(this).parents(".dbIndex").remove();
        return false;
    });
    newIndex.children(".editIndexIcon").on("mousedown", function () {
        CurrentIndex = $(this).parents(".dbIndex");
        CurrentTable = $(this).parents(".dbTable");
        editIndexDialog.dialog("open");
        return false;
    });
    table.children(".dbTableIndexArea").append(newIndex);
}

function AddView(viewName, viewQuery) {
    newView = $('<div class="dbView" style="top: 100px; left: 20px;"><div class="dbViewHeader"><div class="deleteViewIcon fa fa-remove"></div>'
    + '<div class="dbViewName">View: ' + viewName + '</div><div class="editViewIcon fa fa-pencil"></div></div></div>');

    $("#database-container").append(newView);
    newView.find(".editViewIcon").on("click", function () {
        CurrentView = $(this).parents(".dbView");
        editViewDialog.dialog("open");
    });
    newView.find(".deleteViewIcon").on("click", function () {
        $(this).parents(".dbView").remove();
    });
    newView.data("dbViewName", viewName);
    newView.data("dbViewQuery", viewQuery);
    instance.draggable(newView);
}

function CheckColumnLengthSupport(dialog, typeCode) {
    // Check if data type supports column length
    currentType = SqlServerDataTypes.filter(function (val) {
        return val[0] == typeCode;
    });
    if (!typeCode) {
        dialog.find("#columnLengthNotSupported").show();
        dialog.find("#column-length").hide();
        dialog.find("#column-length-max").hide();
        dialog.find("label[for=column-length-max]").hide();
    } else if (currentType[0][2]) {
        dialog.find("#columnLengthNotSupported").hide();
        dialog.find("#column-length").show();
        dialog.find("#column-length-max").show();
        dialog.find("label[for=column-length-max]").show();
    } else {
        dialog.find("#columnLengthNotSupported").show();
        dialog.find("#column-length").hide();
        dialog.find("#column-length-max").hide();
        dialog.find("label[for=column-length-max]").hide();
    }
}

// Format: 1-code, 2-label, 3-supports column length?
SqlServerDataTypes = [
    ["varchar", "Varchar", true],
    ["boolean", "Boolean", false],
    ["integer", "Integer", false],
    ["float", "Float", false],
    ["currency", "Currency", false],
    ["decimal", "Decimal", false],
    ["date", "Date", false],
    ["time", "Time", false],
    ["datetime", "DateTime", false],
    ["timestamp", "Timestamp", false],
    ["xml", "XML", true],
    ["blob", "Blob", true],
];

function SaveDbScheme(commitMessage) {
    pageSpinner.show();
    columnIdCounter = 0;
    tableArray = [];
    relationArray = [];
    viewArray = [];
    $("#database-container .dbTable").each(function (tableIndex, tableDiv) {
        columnArray = [];
        indexArray = [];
        $(tableDiv).data("dbTableId", tableIndex);
        $(tableDiv).find(".dbColumn").each(function (columnIndex, columnDiv) {
            columnArray.push({
                Id: columnIdCounter,
                Name: $(columnDiv).find(".dbColumnName").text(),
                DisplayName: $(columnDiv).data("dbColumnDisplayName"),
                Type: $(columnDiv).attr("dbColumnType"),
                PrimaryKey: $(columnDiv).hasClass("dbPrimaryKey"),
                Unique: $(columnDiv).data("dbUnique"),
                AllowNull: $(columnDiv).data("dbAllowNull"),
                DefaultValue: $(columnDiv).data("dbDefaultValue"),
                ColumnLength: $(columnDiv).data("dbColumnLength"),
                ColumnLengthIsMax: $(columnDiv).data("dbColumnLengthMax")
            });
            $(columnDiv).data("dbColumnId", columnIdCounter);
            columnIdCounter++;
        });
        $(tableDiv).find(".dbIndex").each(function (indexIndex, indexDiv) {
            originalIndexColumnArray = $(indexDiv).data("indexColumnArray");
            filteredIndexColumnArray = [];
            for (i = 0; i < originalIndexColumnArray.length; i++) {
                if (originalIndexColumnArray[i] != "-none-")
                    filteredIndexColumnArray.push(originalIndexColumnArray[i]);
            }
            indexArray.push({
                Id: indexIndex,
                Name: $(indexDiv).data("indexName"),
                ColumnNames: filteredIndexColumnArray,
                Unique: $(indexDiv).data("unique")
            });
        });
        tableArray.push({
            Id: tableIndex,
            Name: $(tableDiv).find(".dbTableName").text(),
            PositionX: parseInt($(tableDiv).css("left")),
            PositionY: parseInt($(tableDiv).css("top")),
            Columns: columnArray,
            Indices: indexArray
        });
    });
    jsPlumbConnections = instance.getAllConnections();

    for (i = 0; i < jsPlumbConnections.length; i++) {
        currentConnection = jsPlumbConnections[i];
        sourceDiv = $(currentConnection.source);
        targetDiv = $(currentConnection.target);
        relationArray.push({
            LeftTable: sourceDiv.parents(".dbTable").data("dbTableId"),
            rightTable: targetDiv.parents(".dbTable").data("dbTableId"),
            LeftColumn: sourceDiv.data("dbColumnId"),
            RightColumn: targetDiv.data("dbColumnId"),
            Type: $(currentConnection).data("relationType")
        });
    }
    $("#database-container .dbView").each(function (viewIndex, viewDiv) {
        viewArray.push({
            Id: viewIndex,
            Name: $(viewDiv).data("dbViewName"),
            Query: $(viewDiv).data("dbViewQuery"),
            PositionX: parseInt($(viewDiv).css("left")),
            PositionY: parseInt($(viewDiv).css("top"))
        });
    });
    postData = {
        CommitMessage: commitMessage,
        Tables: tableArray,
        Relations: relationArray,
        Views: viewArray
    }
    appId = $("#currentAppId").val();
    $.ajax({
        type: "POST",
        url: "/api/database/apps/" + appId + "/commits",
        data: postData,
        complete: function () {
            pageSpinner.hide();
        }
    });
}

function LoadDbScheme(commitId) {
    pageSpinner.show();
    appId = $("#currentAppId").val();
    $.ajax({
        type: "GET",
        url: "/api/database/apps/" + appId + "/commits/" + commitId,
        dataType: "json",
        complete: function () {
            pageSpinner.hide()
        },
        success: function (data) {
            ClearDbScheme();
            for (i = 0; i < data.Tables.length; i++) {
                newTable = $('<div class="dbTable"><div class="dbTableHeader"><div class="deleteTableIcon fa fa-remove"></div><div class="dbTableName">'
                    + data.Tables[i].Name + '</div><div class="editTableIcon fa fa-pencil"></div><div class="addColumnIcon fa fa-plus"></div></div>'
                    + '<div class="dbTableBody"><div class="dbColumn idColumn dbPrimaryKey" dbColumnType="integer" dbColumnId="'
                    + data.Tables[i].Columns[0].Id + '"><div class="dbColumnName">id</div></div></div>'
                    + '<div class="dbTableIndexArea"></div></div>');
                $("#database-container").append(newTable);
                $(".editTableIcon").on("click", function () {
                    CurrentTable = $(this).parents(".dbTable");
                    editTableDialog.dialog("open");
                });
                newTable.find(".deleteTableIcon").on("click", function () {
                    $(this).parents(".dbTable").remove();
                    instance.removeAllEndpoints($(this).parents(".dbTable"), true);
                });
                newTable.find(".addColumnIcon").on("click", function () {
                    addColumnDialog.data("currentTable", $(this).parents(".dbTable"));
                    addColumnDialog.dialog("open");
                })
                newTable.find(".deleteColumnIcon").on("mousedown", function () {
                    $(this).parents(".dbColumn").remove();
                    instance.removeAllEndpoints($(this).parents(".dbColumn"), true);
                    return false;
                });
                newTable.find(".editColumnIcon").on("mousedown", function () {
                    CurrentColumn = $(this).parents(".dbColumn");
                    editColumnDialog.dialog("open");
                    return false;
                });
                newTable.css("left", data.Tables[i].PositionX);
                newTable.css("top", data.Tables[i].PositionY);
                instance.draggable(newTable);
                for (j = 1; j < data.Tables[i].Columns.length; j++) {
                    if (data.Tables[i].Columns[j].DefaultValue != null)
                        defaultValue = data.Tables[i].Columns[j].DefaultValue;
                    else
                        defaultValue = "";
                    newColumn = $('<div class="dbColumn"><div class="deleteColumnIcon fa fa-remove"></div><div class="dbColumnName">'
                        + data.Tables[i].Columns[j].Name + '</div><div class="editColumnIcon fa fa-pencil"></div></div>');
                    newColumn.attr("dbColumnType", data.Tables[i].Columns[j].Type);
                    newColumn.attr("dbColumnId", data.Tables[i].Columns[j].Id);
                    newColumn.data("dbUnique", data.Tables[i].Columns[j].Unique);
                    newColumn.data("dbAllowNull", data.Tables[i].Columns[j].AllowNull);
                    newColumn.data("dbDefaultValue", defaultValue);
                    newColumn.data("dbColumnLength", data.Tables[i].Columns[j].ColumnLength);
                    newColumn.data("dbColumnLengthMax", data.Tables[i].Columns[j].ColumnLengthIsMax);
                    newColumn.data("dbColumnDisplayName", data.Tables[i].Columns[j].DisplayName);

                    newColumn.children(".deleteColumnIcon").on("mousedown", function () {
                        $(this).parents(".dbColumn").remove();
                        instance.removeAllEndpoints($(this).parents(".dbColumn"), true);
                        instance.recalculateOffsets();
                        instance.repaintEverything();
                        return false;
                    });
                    newColumn.children(".editColumnIcon").on("mousedown", function () {
                        CurrentColumn = $(this).parents(".dbColumn");
                        editColumnDialog.dialog("open");
                        return false;
                    });
                    newTable.children(".dbTableBody").append(newColumn);
                    if (data.Tables[i].Columns[j].PrimaryKey) {
                        newColumn.addClass("dbPrimaryKey");
                    }
                    newColumn.attr("dbColumnType", data.Tables[i].Columns[j].Type);
                }
                AddColumnToJsPlumb(newTable.find(".dbColumn"));
                for (j = 0; j < data.Tables[i].Indices.length; j++) {
                    indexLabel = "Index: ";
                    for (k = 0; k < data.Tables[i].Indices[j].ColumnNames.length - 1; k++)
                        indexLabel += data.Tables[i].Indices[j].ColumnNames[k] + ", ";
                    indexLabel += data.Tables[i].Indices[j].ColumnNames[data.Tables[i].Indices[j].ColumnNames.length - 1];
                    if (data.Tables[i].Indices[j].Unique)
                        indexLabel += " - unique";
                    newIndex = $('<div class="dbIndex"><div class="deleteIndexIcon fa fa-remove"></div><div class="dbIndexText">' + indexLabel + '</div><div class="editIndexIcon fa fa-pencil"></div></div>');
                    newIndex.data("indexName", data.Tables[i].Indices[j].Name);
                    newIndex.data("indexColumnArray", data.Tables[i].Indices[j].ColumnNames);
                    newIndex.data("unique", data.Tables[i].Indices[j].Unique);
                    newIndex.children(".deleteIndexIcon").on("mousedown", function () {
                        $(this).parents(".dbIndex").remove();
                        return false;
                    });
                    newIndex.children(".editIndexIcon").on("mousedown", function () {
                        CurrentIndex = $(this).parents(".dbIndex");
                        CurrentTable = $(this).parents(".dbTable");
                        editIndexDialog.dialog("open");
                        return false;
                    });
                    newTable.children(".dbTableIndexArea").append(newIndex);
                }
            }
            for (i = 0; i < data.Relations.length; i++) {
                sourceDiv = $("#database-container .dbColumn[dbColumnId='" + data.Relations[i].LeftColumn + "']");
                targetDiv = $("#database-container .dbColumn[dbColumnId='" + data.Relations[i].RightColumn + "']");
                newConnection = instance.connect({ source: sourceDiv.attr("id"), target: targetDiv.attr("id"), editable: true });
                $(newConnection).data("relationType", data.Relations[i].Type);
                switch (data.Relations[i].Type) {
                    case 2:
                        EditRelation(newConnection, "1", "N");
                        break;
                    case 3:
                        EditRelation(newConnection, "N", "1");
                        break;
                    case 4:
                        EditRelation(newConnection, "M", "N");
                        break;
                }
            }
            for (i = 0; i < data.Views.length; i++) {
                newView = $('<div class="dbView"><div class="dbViewHeader"><div class="deleteViewIcon fa fa-remove"></div>'
                    + '<div class="dbViewName">View: ' + data.Views[i].Name + '</div><div class="editViewIcon fa fa-pencil"></div></div></div>');

                $("#database-container").append(newView);
                newView.find(".editViewIcon").on("click", function () {
                    CurrentView = $(this).parents(".dbView");
                    editViewDialog.dialog("open");
                });
                newView.find(".deleteViewIcon").on("click", function () {
                    $(this).parents(".dbView").remove();
                });
                newView.css("left", data.Views[i].PositionX);
                newView.css("top", data.Views[i].PositionY);
                newView.data("dbViewName", data.Views[i].Name);
                newView.data("dbViewQuery", data.Views[i].Query);
                instance.draggable(newView);
            }
        }
    });
}

var ZoomFactor = 1.0;
$(function () {
    if (CurrentModuleIs("dbDesignerModule")) {
        $("#btnAddTable").on("click", function () {
            addTableDialog.dialog("open");
        });
        $("#btnAddView").on("click", function () {
            addViewDialog.dialog("open");
        });
        $("#switchToWorkflow").on("click", function () {
            window.location = "/workflow";
        });
        $("#btnSaveScheme").on("click", function () {
            saveDialog.dialog("open");
        });
        $("#btnLoadScheme").on("click", function () {
            LoadDbScheme("latest");
        });
        $("#btnOpenHistory").on("click", function () {
            historyDialog.dialog("open");
        });
        $("#btnClearScheme").on("click", function () {
            ClearDbScheme();
        });
        $("#btnZoomIn").on("click", function () {
            ZoomFactor += 0.1;
            $(".database-container").css("transform", "scale(" + ZoomFactor + ")");
            $("#zoomLabel").text("Zoom " + Math.floor(ZoomFactor * 100) + "%");
            instance.repaintEverything();
        });
        $("#btnZoomOut").on("click", function () {
            if (ZoomFactor >= 0.2)
                ZoomFactor -= 0.1;
            $(".database-container").css("transform", "scale(" + ZoomFactor + ")");
            $("#zoomLabel").text("Zoom " + Math.floor(ZoomFactor * 100) + "%");
            instance.repaintEverything();
        });

        LoadDbScheme("latest");
    }
});

 var CurrentTable, CurrentColumn, CurrentConnection, CurrentView, CurrentIndex;

$(function () {
    if (CurrentModuleIs("dbDesignerModule")) {
        addTableDialog = $("#add-table-dialog").dialog({
            autoOpen: false,
            resizable: false,
            width: 400,
            height: 150,
            buttons: {
                "Add": function () {
                    addTableDialog_SubmitData();
                },
                Cancel: function () {
                    addTableDialog.dialog("close");
                }
            },
            create: function () {
                $(this).keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        addTableDialog_SubmitData();
                        return false;
                    }
                })
            },
            open: function () {
                addTableDialog.find("#new-table-name").val("");
            }
        });
        function addTableDialog_SubmitData() {
            AddTable(addTableDialog.find("#new-table-name").val());
            addTableDialog.dialog("close");
        }

        editTableDialog = $("#edit-table-dialog").dialog({
            autoOpen: false,
            resizable: false,
            width: 400,
            height: 170,
            buttons: {
                "Save": function () {
                    editTableDialog_SubmitData();
                },
                Cancel: function () {
                    editTableDialog.dialog("close");
                }
            },
            create: function () {
                $(this).keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        editTableDialog_SubmitData();
                        return false;
                    }
                });
                $(this).find("#add-index-button").on("click", function () {
                    addIndexDialog.dialog("open");
                });
            },
            open: function () {
                editTableDialog.find("#table-name").val(CurrentTable.find(".dbTableName").text());
            }
        });
        function editTableDialog_SubmitData() {
            CurrentTable.find(".dbTableName").text(editTableDialog.find("#table-name").val());
            editTableDialog.dialog("close");
        }

        addColumnDialog = $("#add-column-dialog").dialog({
            autoOpen: false,
            resizable: false,
            width: 400,
            height: 330,
            buttons: {
                "Add": function () {
                    addColumnDialog_SubmitData();
                },
                Cancel: function () {
                    addColumnDialog.dialog("close");
                }
            },
            create: function () {
                for (i = 0; i < SqlServerDataTypes.length; i++) {
                    $("#add-column-dialog #column-type-dropdown").append(
                        $('<option value="' + SqlServerDataTypes[i][0] + '">' + SqlServerDataTypes[i][1] + '</option>'));
                }
                $("#add-column-dialog #column-type-dropdown").change(function () {
                    CheckColumnLengthSupport(addColumnDialog, this.value);
                    if (addColumnDialog.find("#column-length-max").is(":checked")) {
                        addColumnDialog.find("#column-length").hide();
                    }
                });
                $("#add-column-dialog #column-length-max").change(function () {
                    if ($(this).is(":checked")) {
                        addColumnDialog.find("#column-length").hide();
                    } else {
                        addColumnDialog.find("#column-length").show();
                    }
                });
                $(this).keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        addColumnDialog_SubmitData();
                        return false;
                    }
                })
            },
            open: function () {
                addColumnDialog.find("#column-name").val("");
                addColumnDialog.find("#column-display-name").val("");
                addColumnDialog.find("#primary-key-checkbox").prop("checked", false);
                addColumnDialog.find("#unique-checkbox").prop("checked", false);
                addColumnDialog.find("#allow-null-checkbox").prop("checked", false);
                addColumnDialog.find("#column-type-dropdown").val("varchar");
                addColumnDialog.find("#default-value").val("");
                addColumnDialog.find("#column-length").val(100);
                addColumnDialog.find("#column-length-max").prop("checked", true);
                addColumnDialog.find("#columnLengthNotSupported").hide();
                CheckColumnLengthSupport(addColumnDialog, "varchar");
                addColumnDialog.find("#column-length").hide();
            }
        });
        function addColumnDialog_SubmitData() {
            AddColumn(addColumnDialog.data("currentTable"),
                addColumnDialog.find("#column-name").val(),
                addColumnDialog.find("#column-type-dropdown").val(),
                addColumnDialog.find("#primary-key-checkbox").prop("checked"),
                addColumnDialog.find("#allow-null-checkbox").prop("checked"),
                addColumnDialog.find("#default-value").val(),
                addColumnDialog.find("#column-length").val(),
                addColumnDialog.find("#column-length-max").prop("checked"),
                addColumnDialog.find("#unique-checkbox").prop("checked"),
                addColumnDialog.find("#column-display-name").val());
            addColumnDialog.dialog("close");
        }

        editColumnDialog = $("#edit-column-dialog").dialog({
            autoOpen: false,
            resizable: false,
            width: 400,
            height: 330,
            buttons: {
                "Save": function () {
                    editColumnDialog_SubmitData();
                },
                Cancel: function () {
                    editColumnDialog.dialog("close");
                }
            },
            create: function () {
                for (i = 0; i < SqlServerDataTypes.length; i++) {
                    $("#edit-column-dialog #column-type-dropdown").append(
                        $('<option value="' + SqlServerDataTypes[i][0] + '">' + SqlServerDataTypes[i][1] + '</option>'));
                }
                $("#edit-column-dialog #column-type-dropdown").change(function () {
                    CheckColumnLengthSupport(editColumnDialog, this.value);
                    if (editColumnDialog.find("#column-length-max").is(":checked")) {
                        editColumnDialog.find("#column-length").hide();
                    }
                });
                $("#edit-column-dialog #column-length-max").change(function () {
                    if ($(this).is(":checked")) {
                        editColumnDialog.find("#column-length").hide();
                    } else {
                        editColumnDialog.find("#column-length").show();
                    }
                });
                $(this).keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        editColumnDialog_SubmitData();
                        return false;
                    }
                });
            },
            open: function () {
                editColumnDialog.find("#column-name").val(CurrentColumn.find(".dbColumnName").text());
                editColumnDialog.find("#column-display-name").val(CurrentColumn.data("dbColumnDisplayName"));
                editColumnDialog.find("#primary-key-checkbox").prop("checked", CurrentColumn.hasClass("dbPrimaryKey"));
                editColumnDialog.find("#unique-checkbox").prop("checked", CurrentColumn.data("dbUnique"));
                editColumnDialog.find("#allow-null-checkbox").prop("checked", CurrentColumn.data("dbAllowNull"));
                editColumnDialog.find("#column-type-dropdown").val(CurrentColumn.attr("dbColumnType"));
                editColumnDialog.find("#default-value").val(CurrentColumn.data("dbDefaultValue"));
                editColumnDialog.find("#column-length").val(CurrentColumn.data("dbColumnLength"));
                editColumnDialog.find("#column-length-max").prop("checked", CurrentColumn.data("dbColumnLengthMax"));
                CheckColumnLengthSupport(editColumnDialog, CurrentColumn.attr("dbColumnType"));
                if (CurrentColumn.data("dbColumnLengthMax"))
                    editColumnDialog.find("#column-length").hide();
            }
        });
        function editColumnDialog_SubmitData() {
            CurrentColumn.find(".dbColumnName").text(editColumnDialog.find("#column-name").val());
            CurrentColumn.attr("dbColumnType", editColumnDialog.find("#column-type-dropdown").val());
            CurrentColumn.data("dbUnique", editColumnDialog.find("#unique-checkbox").prop("checked"));
            CurrentColumn.data("dbAllowNull", editColumnDialog.find("#allow-null-checkbox").prop("checked"));
            CurrentColumn.data("dbDefaultValue", editColumnDialog.find("#default-value").val());
            CurrentColumn.data("dbColumnLength", editColumnDialog.find("#column-length").val());
            CurrentColumn.data("dbColumnLengthMax", editColumnDialog.find("#column-length-max").prop("checked"));
            CurrentColumn.data("dbColumnDisplayName", editColumnDialog.find("#column-display-name").val());
            if (CurrentColumn.hasClass("dbPrimaryKey") && !editColumnDialog.find("#primary-key-checkbox").prop("checked"))
                CurrentColumn.removeClass("dbPrimaryKey");
            else if (!CurrentColumn.hasClass("dbPrimaryKey") && editColumnDialog.find("#primary-key-checkbox").prop("checked")) {
                //CurrentColumn.parents(".dbTable").find(".dbColumn").removeClass("dbPrimaryKey"); // Uncomment this line to allow only one primary key per table
                CurrentColumn.addClass("dbPrimaryKey");
            }
            editColumnDialog.dialog("close");
        }

        editRelationDialog = $("#edit-relation-dialog").dialog({
            autoOpen: false,
            resizable: false,
            width: 400,
            height: 250,
            buttons: {
                "Save": function () {
                    editRelationDialog_SubmitData()
                },
                Cancel: function () {
                    editRelationDialog.dialog("close");
                }
            },
            create: function () {
                $(this).keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        editRelationDialog_SubmitData();
                        return false;
                    }
                })
            },
            open: function () {
                if ($(CurrentConnection).data("relationType"))
                    editRelationDialog.find("input:radio[value=" + $(CurrentConnection).data("relationType") + "]").prop("checked", "checked");
                else
                    editRelationDialog.find("input:radio[value=1]").prop("checked", "checked");
            }
        });
        function editRelationDialog_SubmitData() {
            $(CurrentConnection).data("relationType", editRelationDialog.find("input[type='radio']:checked").val());
            switch (editRelationDialog.find("input[type='radio']:checked").val()) {
                case "1":
                    EditRelation(CurrentConnection, "1", "1");
                    break;
                case "2":
                    EditRelation(CurrentConnection, "1", "N");
                    break;
                case "3":
                    EditRelation(CurrentConnection, "N", "1");
                    break;
                case "4":
                    EditRelation(CurrentConnection, "M", "N");
                    break;
                case "Delete":
                    instance.detach(CurrentConnection);
                    break;
            }
            editRelationDialog.dialog("close");
        }

        historyDialog = $("#history-dialog").dialog({
            autoOpen: false,
            width: 700,
            height: 540,
            buttons: {
                "Load": function () {
                    historyDialog_SubmitData();
                },
                Cancel: function () {
                    historyDialog.dialog("close");
                }
            },
            open: function (event, ui) {
                        historyDialog.find("#commit-table:first tbody:nth-child(2) tr").remove();
                $("#history-dialog .spinner-2").show();
                historyDialog.data("selectedCommitId", null);
                appId = $("#currentAppId").val();
                $.ajax({
                    type: "GET",
                    url: "/api/database/apps/" + appId + "/commits",
                    dataType: "json",
                    success: function (data) {
                        tbody = historyDialog.find("#commit-table tbody:nth-child(2)");
                        commitIdArray = [];

                        // Fill in the history rows
                        for (i = 0; i < data.length; i++) {
                            commitIdArray.push(data[i].Id);
                            if (data[i].CommitMessage != null)
                                tbody.append($('<tr class="commitRow"><td>' + data[i].TimeString
                                    + '</td><td>' + data[i].CommitMessage + '</td></tr>'));
                            else
                                tbody.append($('<tr class="commitRow"><td>' + data[i].TimeString
                                    + '</td><td style="color: darkgrey;">(no message)</td></tr>'));
                        }

                        // Highlight the selected row
                        $(document).on('click', 'tr.commitRow', function (event) {
                            historyDialog.find("#commit-table tbody:nth-child(2) tr").removeClass("highlightedCommitRow");
                            $(this).addClass("highlightedCommitRow");
                            var rowIndex = $(this).index();
                            historyDialog.data("selectedCommitId", commitIdArray[rowIndex]);
                        });
                        $("#history-dialog .spinner-2").hide();
                    }
                });
            }
        });
        function historyDialog_SubmitData() {
            if (historyDialog.data("selectedCommitId")) {
                LoadDbScheme(historyDialog.data("selectedCommitId"));
                historyDialog.dialog("close");
            }
            else
                alert("Please select a commit");
        }
        saveDialog = $("#save-dialog").dialog({
            autoOpen: false,
            width: 400,
            height: 190,
            buttons: {
                "Save": function () {
                    saveDialog_SubmitData();
                },
                Cancel: function () {
                    saveDialog.dialog("close");
                }
            },
            create: function () {
                $(this).keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        saveDialog_SubmitData();
                        return false;
                    }
                })
            },
            open: function () {
                saveDialog.find("#message").val("");
            }
        });
        function saveDialog_SubmitData() {
            saveDialog.dialog("close");
            SaveDbScheme(saveDialog.find("#message").val());
        }

        addViewDialog = $("#add-view-dialog").dialog({
            autoOpen: false,
            resizable: false,
            width: 400,
            height: 310,
            buttons: {
                "Add": function () {
                    addViewDialog_SubmitData();
                },
                Cancel: function () {
                    addViewDialog.dialog("close");
                }
            },
            create: function () {
                $(this).find("#new-view-name").keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        addViewDialog_SubmitData();
                        return false;
                    }
                })
            },
            open: function () {
                addViewDialog.find("#new-view-name").val("");
                addViewDialog.find("#new-view-query").val("");
            }
        });
        function addViewDialog_SubmitData() {
            AddView(addViewDialog.find("#new-view-name").val(),
                addViewDialog.find("#new-view-query").val());
            addViewDialog.dialog("close");
        }

        editViewDialog = $("#edit-view-dialog").dialog({
            autoOpen: false,
            resizable: false,
            width: 400,
            height: 310,
            buttons: {
                "Save": function () {
                    editViewDialog_SubmitData();
                },
                Cancel: function () {
                    editViewDialog.dialog("close");
                }
            },
            create: function () {
                $(this).find("#view-name").keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        editViewDialog_SubmitData();
                        return false;
                    }
                })
            },
            open: function () {
                editViewDialog.find("#view-name").val(CurrentView.data("dbViewName"));
                editViewDialog.find("#view-query").val(CurrentView.data("dbViewQuery"));
            }
        });
        function editViewDialog_SubmitData() {
            CurrentView.find(".dbViewName").text("View: " + editViewDialog.find("#view-name").val());
            CurrentView.data("dbViewName", editViewDialog.find("#view-name").val());
            CurrentView.data("dbViewQuery", editViewDialog.find("#view-query").val());
            editViewDialog.dialog("close");
        }

        addIndexDialog = $("#add-index-dialog").dialog({
            autoOpen: false,
            resizable: false,
            width: 400,
            height: 260,
            buttons: {
                "Add": function () {
                    addIndexDialog_SubmitData();
                },
                Cancel: function () {
                    addIndexDialog.dialog("close");
                }
            },
            create: function () {
                $(this).keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        addIndexDialog_SubmitData();
                        return false;
                    }
                });
                $("#add-index-dialog #btn-add-index-column").on("click", function () {
                    newColumnNumber = addIndexDialog.data("columnsShown") + 1;
                    newFormRow = $('<tr class="additionalFormRow"><td><label for="additional-column">' + newColumnNumber + '. column</label></td>'
                        + '<td><select name="additional-column" class="additionalColumn"></select></td></tr>');
                    newFormRow.find(".additionalColumn").append($('<option value="-none-">-none-</option>'));
                    CurrentTable.find(".dbColumn").each(function (i, val) {
                        newFormRow.find(".additionalColumn").append(
                            $('<option value="' + $(val).find(".dbColumnName").text() + '">' + $(val).find(".dbColumnName").text() + '</option>'));
                    });
                    $("#add-index-dialog").find("#addIndexColumnFormRow").before(newFormRow);
                    addIndexDialog.data("columnsShown", newColumnNumber);
                });
            },
            open: function () {
                addIndexDialog.find("#first-column option").remove();
                CurrentTable.find(".dbColumn").each(function (i, val) {
                    addIndexDialog.find("#first-column").append(
                        $('<option value="' + $(val).find(".dbColumnName").text() + '">' + $(val).find(".dbColumnName").text() + '</option>'));
                });
                addIndexDialog.find("#second-column option").remove();
                addIndexDialog.find("#second-column").append(
                        $('<option value="-none-">-none-</option>'));
                CurrentTable.find(".dbColumn").each(function (i, val) {
                    addIndexDialog.find("#second-column").append(
                        $('<option value="' + $(val).find(".dbColumnName").text() + '">' + $(val).find(".dbColumnName").text() + '</option>'));
                });
                addIndexDialog.find("#index-name").val("");
                addIndexDialog.find("#first-column").val("id");
                addIndexDialog.find("#second-column").val("-none-");
                addIndexDialog.find("#unique-checkbox").prop("checked", false);
                addIndexDialog.find(".additionalFormRow").remove();
                addIndexDialog.data("columnsShown", 1);
            }
        });
        function addIndexDialog_SubmitData() {
            indexColumnArray = [
                addIndexDialog.find("#first-column").val()
            ];
            addIndexDialog.find(".additionalFormRow .additionalColumn").each(function (i, element) {
                indexColumnArray.push($(element).val());
            });
            filteredIndexColumnArray = [];
            for (i = 0; i < indexColumnArray.length; i++) {
                if (indexColumnArray[i] != "-none-")
                    filteredIndexColumnArray.push(indexColumnArray[i]);
            }
            AddIndex(CurrentTable,
                addIndexDialog.find("#index-name").val(),
                filteredIndexColumnArray,
                addIndexDialog.find("#unique-checkbox").prop("checked")
                );
            addIndexDialog.dialog("close");
        }

        editIndexDialog = $("#edit-index-dialog").dialog({
            autoOpen: false,
            resizable: false,
            width: 400,
            height: 230,
            buttons: {
                "Save": function () {
                    editIndexDialog_SubmitData();
                },
                Cancel: function () {
                    editIndexDialog.dialog("close");
                }
            },
            create: function () {
                $(this).keypress(function (e) {
                    if (e.keyCode == $.ui.keyCode.ENTER) {
                        editIndexDialog_SubmitData();
                        return false;
                    }
                });
                $("#edit-index-dialog #btn-add-index-column").on("click", function () {
                    newColumnNumber = editIndexDialog.data("columnsShown") + 1;
                    newFormRow = $('<tr class="additionalFormRow"><td><label for="additional-column">' + newColumnNumber + '. column</label></td>'
                        + '<td><select name="additional-column" class="additionalColumn"></select></td></tr>');
                    newFormRow.find(".additionalColumn").append($('<option value="-none-">-none-</option>'));
                    CurrentTable.find(".dbColumn").each(function (i, val) {
                        newFormRow.find(".additionalColumn").append(
                            $('<option value="' + $(val).find(".dbColumnName").text() + '">' + $(val).find(".dbColumnName").text() + '</option>'));
                    });
                    $("#edit-index-dialog").find("#addIndexColumnFormRow").before(newFormRow);
                    editIndexDialog.data("columnsShown", newColumnNumber);
                });
            },
            open: function () {
                editIndexDialog.find("#first-column option").remove();
                CurrentTable.find(".dbColumn").each(function (i, val) {
                    editIndexDialog.find("#first-column").append(
                        $('<option value="' + $(val).find(".dbColumnName").text() + '">' + $(val).find(".dbColumnName").text() + '</option>'));
                });
                editIndexDialog.find("#second-column option").remove();
                editIndexDialog.find("#second-column").append(
                        $('<option value="-none-">-none-</option>'));
                CurrentTable.find(".dbColumn").each(function (i, val) {
                    editIndexDialog.find("#second-column").append(
                        $('<option value="' + $(val).find(".dbColumnName").text() + '">' + $(val).find(".dbColumnName").text() + '</option>'));
                });
                indexColumnArray = CurrentIndex.data("indexColumnArray");
                if (!indexColumnArray)
                    indexColumnArray = ["id"];
                editIndexDialog.data("columnsShown", indexColumnArray.length);
                editIndexDialog.find("#index-name").val(CurrentIndex.data("indexName"));
                editIndexDialog.find("#first-column").val(indexColumnArray[0]);
                editIndexDialog.find("#second-column").val(indexColumnArray[1]);
                editIndexDialog.find("#unique-checkbox").prop("checked", CurrentIndex.data("unique"));
                editIndexDialog.find(".additionalFormRow").remove();
                for (i = 1; i < indexColumnArray.length; i++) {
                    newFormRow = $('<tr class="additionalFormRow"><td><label for="additional-column">' + (i + 1) + '. column</label></td>'
                        + '<td><select name="additional-column" class="additionalColumn"></select></td></tr>');
                    newFormRow.find(".additionalColumn").append($('<option value="-none-">-none-</option>'));
                    CurrentTable.find(".dbColumn").each(function (i, val) {
                        newFormRow.find(".additionalColumn").append(
                            $('<option value="' + $(val).find(".dbColumnName").text() + '">' + $(val).find(".dbColumnName").text() + '</option>'));
                    });
                    newFormRow.find(".additionalColumn").val(indexColumnArray[i]);
                    $("#edit-index-dialog").find("#addIndexColumnFormRow").before(newFormRow);
                };
            }
        });
        function editIndexDialog_SubmitData() {
            indexColumnArray = [
                editIndexDialog.find("#first-column").val()
            ];
            editIndexDialog.find(".additionalFormRow .additionalColumn").each(function (i, element) {
                indexColumnArray.push($(element).val());
            });
            filteredIndexColumnArray = [];
            for (i = 0; i < indexColumnArray.length; i++) {
                if (indexColumnArray[i] != "-none-")
                    filteredIndexColumnArray.push(indexColumnArray[i]);
            }
            indexLabel = "Index: ";
            for (i = 0; i < filteredIndexColumnArray.length - 1; i++)
                indexLabel += filteredIndexColumnArray[i] + ", ";
            indexLabel += filteredIndexColumnArray[filteredIndexColumnArray.length - 1];
            if (editIndexDialog.find("#unique-checkbox").prop("checked"))
                indexLabel += " - unique";

            newIndex = $('<div class="dbIndex"><div class="deleteIndexIcon fa fa-remove"></div><span class="dbIndexText">'
                + indexLabel + '</span><div class="editIndexIcon fa fa-pencil"></div></div>');
            newIndex.children(".deleteIndexIcon").on("click", function () {
                $(this).parents(".dbIndex").remove();
            });
            newIndex.children(".editIndexIcon").on("click", function () {
                CurrentIndex = $(this).parents(".dbIndex");
                CurrentTable = $(this).parents(".dbTable");
                editIndexDialog.dialog("open");
            });
            newIndex.data("indexName", editIndexDialog.find("#index-name").val());
            newIndex.data("indexColumnArray", filteredIndexColumnArray);
            newIndex.data("unique", editIndexDialog.find("#unique-checkbox").prop("checked"));
            CurrentIndex.replaceWith(newIndex);
            editIndexDialog.dialog("close");
        }
    }
});

var CurrentAppId;

$(function () {
    appPropertiesDialog = $("#app-properties-dialog").dialog({
        autoOpen: false,
        resizable: false,
        width: 600,
        height: 320,
        buttons: {
            "Uložit": function () {
                appPropertiesDialog_SubmitData();
            },
            "Zrušit": function () {
                appPropertiesDialog.dialog("close");
            }
        },
        create: function () {
            $(this).keypress(function (e) {
                if (e.keyCode == $.ui.keyCode.ENTER) {
                    appPropertiesDialog_SubmitData();
                    return false;
                }
            });
        },
        open: function () {
            appPropertiesDialog.find("#app-name").val("");
            appPropertiesDialog.find("#template").val(1);
            appPropertiesDialog.find("#tile-width").val(2);
            appPropertiesDialog.find("#tile-height").val(1);
            appPropertiesDialog.find("#bg-color").val(0);
            appPropertiesDialog.find("#icon-class").val("");
            $.ajax({
                type: "GET",
                url: "/api/master/apps/" + CurrentAppId + "/properties",
                dataType: "json",
                success: function (data) {
                    appPropertiesDialog.find("#app-name").val(data.DisplayName);
                    appPropertiesDialog.find("#template").val(data.CSSTemplateId);
                    appPropertiesDialog.find("#tile-width").val(data.TileWidth);
                    appPropertiesDialog.find("#tile-height").val(data.TileHeight);
                    appPropertiesDialog.find("#bg-color").val(data.Color);
                    appPropertiesDialog.find("#icon-class").val(data.Icon);
                }
            });
        }
    });
    function appPropertiesDialog_SubmitData() {
        appPropertiesDialog.dialog("close");
        postData = {
            DisplayName: appPropertiesDialog.find("#app-name").val(),
            CSSTemplateId: appPropertiesDialog.find("#template").val(),
            TileWidth: appPropertiesDialog.find("#tile-width").val(),
            TileHeight: appPropertiesDialog.find("#tile-height").val(),
            Color: appPropertiesDialog.find("#bg-color").val(),
            Icon: appPropertiesDialog.find("#icon-class").val()
        }
        $.ajax({
            type: "POST",
            url: "/api/master/apps/" + CurrentAppId + "/properties",
            data: postData,
            success: function() {
                alert("OK");
                // Reload page to change application name in AppManager table
                // after application name was changed
                location.reload();
            }
        });
    }
    addAppDialog = $("#new-app-dialog").dialog({
        autoOpen: false,
        resizable: false,
        width: 600,
        height: 320,
        buttons: {
            "Přidat": function () {
                addAppDialog_SubmitData();
            },
            "Zrušit": function () {
                addAppDialog.dialog("close");
            }
        },
        create: function () {
            $(this).keypress(function (e) {
                if (e.keyCode == $.ui.keyCode.ENTER) {
                    addAppDialog_SubmitData();
                    return false;
                }
            });
        },
        open: function () {
            addAppDialog.find("#app-name").val("");
            addAppDialog.find("#template").val(1);
            addAppDialog.find("#tile-width").val(2);
            addAppDialog.find("#tile-height").val(1);
            addAppDialog.find("#bg-color").val(0);
            addAppDialog.find("#icon-class").val("fa-question");
        }
    });
    function addAppDialog_SubmitData() {
        addAppDialog.dialog("close");
        postData = {
            DisplayName: addAppDialog.find("#app-name").val(),
            Template: addAppDialog.find("#template").val(),
            TileWidth: addAppDialog.find("#tile-width").val(),
            TileHeight: addAppDialog.find("#tile-height").val(),
            Color: addAppDialog.find("#bg-color").val(),
            Icon: addAppDialog.find("#icon-class").val()
        }
        $.ajax({
            type: "POST",
            url: "/api/master/apps",
            data: postData,
            success: function () {
                location.reload();
            }
        });
    }
    appBuildDialog = $("#app-build-dialog").dialog({
        autoOpen: false,
        resizable: false,
        width: 640,
        height: 320
    });
});

$(function () {
    if (CurrentModuleIs("adminAppModule")) {
        $(".adminAppTable .btnOpenWorkflow").on("click", function () {
            CurrentAppId = $(this).parents("tr").attr("appId");
            openMetablockForm = $("#openMetablockForm");
            openMetablockForm.find("input[name='appId']").val(CurrentAppId);
            openMetablockForm.submit();
        });
        $(".adminAppTable .btnOpenDbScheme").on("click", function () {
            CurrentAppId = $(this).parents("tr").attr("appId");
            openMetablockForm = $("#openDbSchemeForm");
            openMetablockForm.find("input[name='appId']").val(CurrentAppId);
            openMetablockForm.submit();
        });
        $(".adminAppTable .btnOpenMozaic").on("click", function () {
            CurrentAppId = $(this).parents("tr").attr("appId");
            openMetablockForm = $("#openMozaicForm");
            openMetablockForm.find("input[name='appId']").val(CurrentAppId);
            openMetablockForm.submit();
        });

        var currentWs;
        $(".adminAppTable .actions .btnValidate").on("click", function () {
            CurrentAppId = $(this).parents("tr").attr("appId");

            if (typeof WebSocket === "undefined") {
                ShowAppNotification("Váš prohlížeč nepodporuje webSockety, a nemůže být využit k aktualizaci aplikací", "error");
                return;
            }

            appBuildDialog.dialog("option", { title: "aktualizuji " + $(this).parents("tr").data("displayName") }).empty().dialog("open");
            var messagesById = {};

            var ws = new WebSocket('ws://' + window.location.hostname + ':' + window.location.port + '/Master/AppAdminManager/BuildApp/' + CurrentAppId);
            currentWs = ws;
            //var timeLast = Date.now();
            ws.onerror = function () {
                $(document).trigger("ajaxError", {})
            }
            ws.onmessage = function (event) {
                if (currentWs !== ws) return;

                //console.log(Date.now() - timeLast, event.data);
                //timeLast = Date.now();

                var response;
                try{
                    response = JSON.parse(event.data);
                } catch(e) {
                    response = { message: event.data, type: "error" };
                }

                var $message;
                if (response.id && messagesById[response.id]) {
                    $message = messagesById[response.id];
                } else {
                    var $parent = response.childOf ? messagesById[response.childOf] : appBuildDialog;
                    $message = $("<div class='app-alert'><span>").data("messageId", response.id).appendTo($parent);
                    if (!$parent.is("#app-build-dialog, .app-alert-odd")) $message.addClass("app-alert-odd");
                    if (response.id) messagesById[response.id] = $message;
                }

                if (response.message) $message.children("span").html(response.message);

                $message.removeClass("app-alert-info app-alert-error app-alert-success app-alert-warning").addClass("app-alert-" + (response.type || "info"));

                if (response.abort) $message.nextAll().remove();

                if (response.done) {
                    setTimeout(function () { appBuildDialog.dialog("close") }, 1000);
                }

                var childrenHeight = 0;
                appBuildDialog.children().each(function () {
                    childrenHeight += $(this).outerHeight();
                });
                appBuildDialog.css({ height: childrenHeight + 32 });
            };
        });
        $(".adminAppTable .actions .btnProperties").on("click", function () {
            CurrentAppId = $(this).parents("tr").attr("appId");
            appPropertiesDialog.dialog("open");
        });
        $(".adminAppTable .actions .btnToggleEnabled").on("click", function () {
            thisButton = $(this);
            appId = thisButton.parents("tr").attr("appId");
            isEnabledCell = thisButton.parents("tr").find(".isEnabledColumn");
            if (thisButton.hasClass("btnDisable")) {
                postData = {
                    IsEnabled: false
                }
                $.ajax({
                    type: "POST",
                    url: "/api/master/apps/" + appId + "/state",
                    data: postData,
                    success: function () {
                        thisButton.removeClass("btnDisable");
                        thisButton.addClass("btnEnable");
                        thisButton.removeClass("btn-danger");
                        thisButton.addClass("btn-primary");
                        thisButton.text("Povolit");
                        isEnabledCell.text("Ne");
                    }
                });
            }
            else {
                postData = {
                    IsEnabled: true
                }
                $.ajax({
                    type: "POST",
                    url: "/api/master/apps/" + appId + "/state",
                    data: postData,
                    success: function () {
                        thisButton.removeClass("btnEnable");
                        thisButton.addClass("btnDisable");
                        thisButton.removeClass("btn-primary");
                        thisButton.addClass("btn-danger");
                        thisButton.text("Zakázat");
                        isEnabledCell.text("Ano");
                    }
                });
            }
        });
        $("#btnAddApp").on("click", function () {
            addAppDialog.dialog("open");
        });
    }
});