﻿$(function () {
    if (CurrentModuleIs("personaModulesModule") || CurrentModuleIs("personaRolesModule")) {
        $(".checkboxCell").on("click", function () {
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
        $("#btnSaveModuleAccessTable").on("click", function () {
            SaveModulePermissions();
        });
        $("#btnReloadModuleAccessTable").on("click", function () {
            location.reload();
        });
    }
});
