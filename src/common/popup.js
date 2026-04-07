// GSO-SPF
// Graduate School of Oceanography - Simple Popup Framework

class popup {
    constructor(init = {}, basics = {}, functionality = {}, options = {}) {
        this.parent = init.parent || document.body || document.documentElement;

        this.title = basics.title || "Popup Title";
        this.content = basics.content || "<p>Popup Content</p>";

        this.onOpen = functionality.onOpen || function() {};
        this.onClose = functionality.onClose || function() {};
        this.onOpen_FirstTime = functionality.onOpen_FirstTime || function() {};

        this.isFullscreen = options.isFullscreen || true;
        this.debug = options.debug || false;
        this.width = options.width || "70%";
        this.height = options.height || "80%";

        this.hasOpened = false;
        this.init();
    }

    init() {
        // Create the main popup box
        const popupBox = document.createElement("div");
        popupBox.classList.add("popup-box");
        if (this.isFullscreen) {
            popupBox.classList.add("fullscreen");
        }

        popupBox.style.width = this.width;
        popupBox.style.height = this.height;

        // Create the overlay
        const overlay = document.createElement("div");
        overlay.classList.add("popup-overlay");

        // Create the header
        const header = document.createElement("div");
        header.classList.add("popup-header");

        // Assign the header to this.header
        this.header = header;

        // Create the title
        const title = document.createElement("h2");
        title.classList.add("popup-title");
        title.textContent = this.title;

        // Create the content wrapper
        const contentWrapper = document.createElement("div");
        contentWrapper.classList.add("popup-content-wrapper");
        this.contentWrapper = contentWrapper; // Store reference to content wrapper for later use
        
        // Create the content container
        const content = document.createElement("div");
        content.classList.add("popup-content");
        content.innerHTML = this.content; // Assuming content is HTML string. If it's plain text, use textContent instead.

        // Create the close button
        const closeBtn = document.createElement("button");
        closeBtn.classList.add("popup-close");
        closeBtn.textContent = "X";

        closeBtn.addEventListener("click", () => {
            this.close();
        });

        // Assemble the tree
        header.appendChild(title);
        header.appendChild(closeBtn);
        popupBox.appendChild(header);
        contentWrapper.appendChild(content);
        popupBox.appendChild(contentWrapper);

        // Now popupBox contains your full structure and can be added to the DOM
        this.popupBox = popupBox;
        this.overlay = overlay;

        this.popupBox.style.display = "none";
        this.overlay.style.display = "none";
        this.parent.appendChild(this.overlay);
        this.parent.appendChild(this.popupBox);
    }

    open() {
        this.overlay.style.display = 'block';
        this.popupBox.style.display = 'block';
        if (!this.hasOpened) {
            this.onOpen_FirstTime();
        }
        this.onOpen();

        this.hasOpened = true;
    }

    close() {
        this.overlay.style.display = 'none';
        this.popupBox.style.display = 'none';
        this.onClose();
    }

    delete() {
        if (this.popupBox.parentNode) {
            this.popupBox.parentNode.removeChild(this.popupBox);
        }
    }
}

class NotificationPopup extends popup {
    constructor(init = {}, basics = {}, functionality = {}, options = {}) {
        super(init, basics, functionality, options);
        this.notificationType = init.notificationType || "info"; // Default to "info" if not provided

        // Add the icon after the parent class's init method has completed
        this.addIcon();
    }

    addIcon() {
        this.contentWrapper.classList.remove("popup-content-wrapper");
        this.contentWrapper.classList.add("popup-content-wrapper_simple");
        // Create the icon element
        const icon = document.createElement("span");
        if (this.notificationType !== null) {
            switch (this.notificationType) {
                case "info":
                    icon.classList.add("icon", "icon-circle-notif");
                    break;
                case "warning":
                    icon.classList.add("icon", "icon-triangle-caution");
                    break;
                case "error":
                    icon.classList.add("icon", "icon-stop-caution");
                    break;
            }
        }

        // Append the icon to the header
        if (this.header) {
            this.header.insertBefore(icon, this.header.firstChild); // Add the icon before the title
        } else {
            console.error("Header element is not defined. Ensure super.init() is called.");
        }
    }
}

class MenuPopup extends popup {
    constructor(init = {}, basics = {}, functionality = {}, options = {}) {
        super(init, basics, functionality, options);
        this.menuItems = init.menuItems || []; // Default to an empty array if not provided
        this.onMenuItemAdded = functionality.onMenuItemAdded || function() {};
        this.onMenuItemDeleted = functionality.onMenuItemDeleted || function() {};
        this.lastOpenedMenuItem = null; // Track the last opened menu item

        this.addMenuBar();
    }

    addMenuBar() {
        const menu = document.createElement("div");
        menu.classList.add("popup-menu");
        if (this.contentWrapper) {
            this.contentWrapper.insertBefore(menu, this.contentWrapper.firstChild);
        } else {
            console.error("Content wrapper is not defined. Ensure super.init() is called.");
        }
    }

    addMenuItem(element,onClick, providedItemData) {
        const menu = this.contentWrapper.querySelector(".popup-menu");
        let wrapper = document.createElement("div");
        wrapper._itemData = providedItemData;

        // init delete button
        let deleteButton = document.createElement('button');
        let deleteIcon = document.createElement('img');
        deleteIcon.src = path.join(pathDep.fromHereToRoot(__dirname), "src", "media", "trashcan.svg");
        deleteButton.style.cursor = 'pointer';
        deleteButton.style.marginLeft = 'auto';
        deleteButton.appendChild(deleteIcon);

        // the old element is now the mainElm so that deleteElms can be handled as well for delete buttons
        let mainElm = element;
        element.classList.add("popup-menu-item");

        let deleteElm = deleteButton;
        deleteElm.classList.add("popup-menu-item-delete");

        wrapper.style.display = 'flex';
        wrapper.appendChild(mainElm);
        wrapper.appendChild(deleteButton);
        const thisDeleteButtonsAssociatedMainElmRef = deleteButton.parentElement.children[0] // this is the main element that the delete button is associated with, this is used in the delete function to know which element to remove when the delete button is clicked, since the main element is a child of the wrapper, we can access it through
        deleteButton.parentElement.children[0]
        mainElm.addEventListener("click", () => {
            onClick();
            this.lastOpenedMenuItem = thisDeleteButtonsAssociatedMainElmRef; // set the last opened menu item to the main element associated with the clicked menu item
        });
        deleteButton.addEventListener("click", () => {
            menu.removeChild(wrapper);
            if (this.lastOpenedMenuItem === thisDeleteButtonsAssociatedMainElmRef) { // if the deleted menu item is the last opened menu item, reset the content to default
                this.updateContent("<p></p>");
            }
            this.onMenuItemDeleted(wrapper._itemData);
        });

        if (menu) {
            menu.appendChild(wrapper);
            this.onMenuItemAdded();
        } else {
            console.error("Menu element not found. Ensure addMenuBar() is called.");
        }
    }

    updateContent(newContent) {
        const content = this.contentWrapper.querySelector(".popup-content");
        if (content) {
            content.innerHTML = newContent; // Assuming newContent is an HTML string. If it's plain text, use textContent instead.
        } else {
            console.error("Content element not found. Ensure super.init() is called.");
        }
    }
}

class SimplePopup extends popup {
    constructor(init = {}, basics = {}, functionality = {}, options = {}) {
        super(init, basics, functionality, options);
        this.contentWrapper.classList.remove("popup-content-wrapper");
        this.contentWrapper.classList.add("popup-content-wrapper_simple");
    }
}

const popupTypes = [
    "simple",
    "log",
    "menu",
]

const notificationTypes = [
    "info",
    "warning",
    "error"
]

const popupTemplates = {
    "Spawn_noFilesToFilter": function() {
        return new NotificationPopup(
            {
                notificationType: "warning"
            },
            {
                title: "No Files To Filter",
                content: "No files available to filter, please import some data first.",
            },
            {
                onClose: function() {
                    console.log("No files to filter popup closed.");
                }
            },
            {
                isFullscreen: false,
                width: "30%",
                height: "30%"

            }
        );
    }
}
module.exports = { 
    popup, 
    NotificationPopup,
    SimplePopup,
    MenuPopup,
    popupTypes, 
    popupTemplates, 
    notificationTypes 
};