(function($) {
  var caseSections = $(".caseSections");
  var renderView = $(".nrm-edit-form");

  $(".caseNavToggle").on("click", function() {
    $(".screenNav").toggleClass("opened");
    caseSections.toggleClass("open");
  });

  $(".navAnchorLink").on("click", function(e) {
    e.preventDefault();

    if ($(this).attr("data-target") === "#home") {
      renderView.animate(
        {
          scrollTop: 0
        },
        500
      );
    } else {
      renderView.animate(
        {
          scrollTop:
            $($.attr(this, "data-target")).offset().top -
            $($.attr(this, "data-target"))
              .offsetParent()
              .offset().top +
            300
        },
        500
      );
    }

    if (caseSections.hasClass("open")) {
      caseSections.removeClass("open");
      $(".screenNav").toggleClass("opened");
    }
  });

  $(".sectionFilter").on("click", function() {
    setActiveTab($(this));
    var status = $(this).attr("data-filter");
    filterSections(status);
  });

  $(".sectionActionLink, .noContent").on("click", "a", function(e) {
    e.preventDefault();
    var target = $(this).attr("href");
    leavePage();
    setTimeout(function() {
      visitPage(target);
    }, pageTransitionTime);
  });

  $("div[data-view-target]").on("click", function() {
    var target = $(this).attr("data-view-target");
    $(".caseContent").attr("data-view", target);
    setActiveTab($(this));
  });

  $(".modal").on("shown.bs.modal", function(event) {
    var button = $(event.relatedTarget);
    $(".modal.in input")[0].focus();
  });

  // Authorized Officer Modal events

  $("#aoInputModalForm").on("submit", function(e) {
    submitAoForm(e);
  });

  $("#aoModal").on("click", 'button[type="submit"]', function(e) {
    submitAoForm(e);
  });

  // Issued Date Modal events

  $("#issuedDateModalForm").on("submit", function(e) {
    submitIssuedDateForm(e);
  });

  $("#issuedDateModal").on("click", 'button[type="submit"]', function(e) {
    submitIssuedDateForm(e);
  });

  // Authoriztion Upload Modal Events
  $("#authUploadModal").on("submit", function(e) {
    submitAuthUploadForm(e);
  });

  $("#authUploadModal").on("click", 'button[type="submit"]', function(e) {
    submitAuthUploadForm(e);
  });

  // Complete Authorization Events

  $(".completeAuthButton").on("click", function() {
    if (
      confirm(
        "Are you sure you want to Complete this Authorization and move it to the Issued Status?"
      )
    ) {
      alert("Issued!");
    }
  });

  setTimeout(function() {
    $(".suds-container").animate(
      {
        opacity: 1,
        left: 0
      },
      pageTransitionTime,
      "easeOutCirc"
    );
  }, 300);

  renderView.scroll(function() {
    if ($(this).scrollTop() > sectionNavOffsetFromRenderViewTop + 10) {
      var t = $(this).offset().top + 10;
      $(".screenNav")
        .addClass("fixed")
        .css({
          top: t + "px"
        });
    } else {
      $(".screenNav")
        .removeClass("fixed")
        .css({
          top: "auto"
        });
    }
  });
})(jQuery);
var pageTransitionTime = 500;
var filterSections = function(status) {
  switch (status) {
    case "done":
      filterDone();
      break;
    case "todo":
      filterToDo();
      break;
    default:
      filterAll();
  }
};

var filterDone = function() {
  $(".caseSection").hide();
  $('.caseSection[data-status="done"]').show();
  $(".navAnchorLink.status").hide();
  $(".navAnchorLink.status.Done").show();
};
var filterAll = function() {
  $(".caseSection").show();
  $(".navAnchorLink.status").show();
};
var filterToDo = function() {
  $(".caseSection").hide();
  $('.caseSection[data-status != "done"]').show();
  $(".navAnchorLink.status").show();
  $(".navAnchorLink.status.Done").hide();
};
var sectionNavOffsetFromRenderViewTop = $(".summaryHeader").height();

var screenNavOffsetFromRenderViewTop = $(".screenNav").offset().top;

var leavePage = function() {
  $(".suds-container").animate(
    {
      opacity: 0,
      left: -600
    },
    pageTransitionTime
  );
};

var setActiveTab = function(targetTab) {
  $(".tabHeading").removeClass("active");
  $(targetTab).addClass("active");
};

var checkViewState = function() {
  return $(".caseContent").attr("data-view");
};

var visitPage = function(target) {
  window.location.href = target;
};

// Authorized Officer Modal Functions

var submitAoForm = function(e) {
  e.preventDefault();
  var name =
    $("#aoModal #lastName").val() +
    ", " +
    $("#aoModal #firstName").val() +
    " (" +
    $("#aoModal #aoTitle").val() +
    ")";

  // swap text block to show updated values
  $(".noAOName").hide();
  $(".hasAOName")
    .text(name)
    .show();

  // close Modal
  $("#aoModal").modal("hide");
  // reset form fields
  $("#aoModal input[type='text']").val("");
  $("#aoModal select").val("");

  // Change class on pill to show success
  $("#aoNamePill")
    .removeClass("sudsPill_warning")
    .addClass("sudsPill_success");

  $("#aoNamePill .sudsPillIcon .fa")
    .addClass("fa-check")
    .removeClass("fa-exclamation-triangle");

  $(".aoActionWord").text("Edit");

  if (authReqsCheck()) {
    enableUploadForm();
  }
};

// submit Issue Date Modal.
var submitIssuedDateForm = function(e) {
  e.preventDefault();
  var date = $("#issuedDateModal #issueDate").val();

  // swap text block to show updated values
  $(".noIssueDate").hide();
  $(".hasIssueDate")
    .text(date)
    .show();

  // close Modal
  $("#issuedDateModal").modal("hide");
  // reset form fields
  $("#issuedDateModal input[type='text']").val("");

  // Change class on pill to show success
  $("#issueDateNamePill")
    .removeClass("sudsPill_warning")
    .addClass("sudsPill_success");

  $("#issueDateNamePill .sudsPillIcon .fa")
    .addClass("fa-check")
    .removeClass("fa-exclamation-triangle");

  $(".idActionWord").text("Edit");

  if (authReqsCheck()) {
    enableUploadForm();
  }
};

// Auth Upload Form methods
var submitAuthUploadForm = function(e) {
  e.preventDefault();

  // close Modal
  $("#authUploadModal").modal("hide");
  // reset form fields
  $("#authUploadModal input[type='file']").val("");

  // Change class on pill to show success
  $(".authUploadCard .sudsPillMessage").addClass("sudsPill_success");

  $(".authUploadCard .sudsPillMessage .sudsPillIcon .fa")
    .addClass("fa-check")
    .removeClass("fa-cloud-upload");

  $(".completeAuthButton").prop("disabled", false);
};

// Check both AO and Issue Date for values

var authReqsCheck = function() {
  return (
    $(".hasAOName").text().length > 0 && $(".hasIssueDate").text().length > 0
  );
};

// Enable Signed Auth Upload form.

var enableUploadForm = function() {
  $(".authUploadCard").addClass("active");
};
