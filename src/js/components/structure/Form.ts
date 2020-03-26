import { HotkeyCustomizer } from "../../modules/general/HotkeyCustomizer";

/**
 * Removes the hassle of creating HTML elements for a form
 */
export class Form {

    private config: FormConfig;
    private elements: FormElement[] = [];

    private index: number = 0;
    private $form: JQuery<HTMLElement>;
    private $inputList: Map<string, JQuery<HTMLElement>> = new Map();

    public constructor(config: FormConfig, elements: FormElement[]) {
        if (config.columns === undefined) config.columns = 1;
        if (config.parent === undefined) config.parent = "body";
        this.config = config;
        elements.forEach(element => { this.addElement(element); });
    }

    /**
     * Adds another element to the form.  
     * Should be run before get() in order for changes to appear
     * @param element FormElement to add
     */
    public addElement(element: FormElement) {
        if (element.id === undefined) element.id = this.index + "";

        if (element.stretch === undefined) element.stretch = "default";

        if (element.label === undefined) element.label = "";
        if (element.value === undefined) element.value = "";

        if (element.required === undefined) element.required = false;
        if (element.pattern === undefined) element.pattern = "";

        if (element.data === undefined) element.data = [];

        this.elements.push(element);
        this.index++;
    }

    /**
     * Returns the DOM element for the form
     * @param force Rebuilds the form from scratch if set to true.
     */
    public get(force?: boolean) {
        if (this.$form !== undefined && !force) { return this.$form; }

        this.$form = $("<form>")
            .attr("id", this.config.id)
            .addClass("grid-form");

        if (this.config.columns > 1) { this.$form.addClass("columns-" + this.config.columns); }

        for (const element of this.elements) {
            let $input;
            switch (element.type) {
                case "input": {
                    $input = this.buildInput(this.$form, element);
                    break;
                }
                case "copyinput": {
                    $input = this.buildCopyInput(this.$form, element);
                    break;
                }
                case "keyinput": {
                    $input = this.buildKeyInput(this.$form, element);
                    break;
                }
                case "icon": {
                    $input = this.buildIconInput(this.$form, element);
                    break;
                }
                case "checkbox": {
                    $input = this.buildCheckbox(this.$form, element);
                    break;
                }
                case "button": {
                    $input = this.buildButton(this.$form, element);
                    break;
                }
                case "submit": {
                    $input = this.buildSubmit(this.$form, element);
                    break;
                }
                case "textarea": {
                    $input = this.buildTextarea(this.$form, element);
                    break;
                }
                case "select": {
                    $input = this.buildSelect(this.$form, element);
                    break;
                }
                case "div": {
                    $input = this.buildDiv(this.$form, element);
                    break;
                }
                case "hr": {
                    $input = this.buildHr(this.$form, element);
                    break;
                }
                default: { }
            }
            this.$inputList.set(element.id, $input);
        }

        $(this.config.parent).on("submit", "form#" + this.config.id, event => {
            event.preventDefault();
            this.$form.trigger("re621:form:submit", this.getInputValues());
        });

        this.$form.trigger("re621:form:create");
        return this.$form;
    }

    /**
     * Returns a list of inputs in the form.  
     * This includes buttons and submit elements.
     */
    public getInputList() {
        return this.$inputList;
    }

    /**
     * Aggregates the values of all inputs in the form.  
     * This includes buttons and submit elements.
     */
    public getInputValues() {
        let values = new Map<string, any>();
        this.$inputList.forEach(function (input, key) {
            values.set(key, input.val());
        });
        return values;
    }

    /**
     * Resets the elements to their default values.  
     * Does not include buttons and submit elements
     */
    public reset() {
        if (this.$form === undefined) return;
        for (const element of this.elements) {
            let $input = this.$form.find("#" + this.config.id + "-" + element.id);
            switch (element.type) {
                case "input":
                case "textarea":
                case "select": {
                    $input.val(element.value);
                    break;
                }
                case "icon": {
                    $input
                        .val(element.value)
                        .trigger("re621:form:update");
                    break;
                }
                case "checkbox": {
                    $input.attr("checked", element.value);
                    break;
                }
                default: { }
            }
        }
    }

    /**
     * Builds and appends an input element
     * @param $form Form to append the element to
     * @param element Element configuration data
     */
    private buildInput($form: JQuery<HTMLElement>, element: FormElement) {
        let labeled = false;
        if (element.label) {
            $("<label>")
                .attr("for", this.config.id + "-" + element.id)
                .html(element.label)
                .appendTo($form);
            labeled = true;
        } else if (element.stretch === "default") { element.stretch = "column"; }

        let $inputContainer = $("<div>")
            .addClass("input-container")
            .toggleClass("labeled", labeled)
            .addClass("stretch-" + element.stretch)
            .appendTo($form);

        let $input = $("<input>")
            .attr("type", "text")
            .attr("id", this.config.id + "-" + element.id)
            .val(element.value)
            .appendTo($inputContainer);

        if (element.pattern) { $input.attr("pattern", element.pattern); }
        if (element.required) { $input.attr("required", ''); }

        return $input;
    }

    /**
     * Builds and appends an input element with a copy button
     * @param $form Form to append the element to
     * @param element Element configuration data
     */
    private buildCopyInput($form: JQuery<HTMLElement>, element: FormElement) {
        let labeled = false;
        if (element.label) {
            $("<label>")
                .attr("for", this.config.id + "-" + element.id)
                .html(element.label)
                .appendTo($form);
            labeled = true;
        } else if (element.stretch === "default") { element.stretch = "column"; }

        let $inputContainer = $("<div>")
            .addClass("input-container")
            .toggleClass("labeled", labeled)
            .addClass("copybox")
            .addClass("stretch-" + element.stretch)
            .appendTo($form);

        let $input = $("<input>")
            .attr("type", "text")
            .attr("id", this.config.id + "-" + element.id)
            .attr("readonly", "")
            .val(element.value)
            .appendTo($inputContainer);

        let $copybutton = $("<button>")
            .attr("type", "button")
            .attr("id", this.config.id + "-" + element.id + "-copy")
            .html(`<i class="far fa-copy"></i>`)
            .appendTo($inputContainer);

        $($copybutton).click(function (event) {
            $input.select();
            document.execCommand("copy");
        });

        return $input;
    }

    /**
     * Builds and appends an input element that records a key press
     * @param $form Form to append the element to
     * @param element Element configuration data
     */
    private buildKeyInput($form: JQuery<HTMLElement>, element: FormElement) {
        let labeled = false;
        if (element.label) {
            $("<label>")
                .attr("for", this.config.id + "-" + element.id)
                .html(element.label)
                .appendTo($form);
            labeled = true;
        } else if (element.stretch === "default") { element.stretch = "column"; }

        let $inputContainer = $("<div>")
            .addClass("input-container")
            .toggleClass("labeled", labeled)
            .addClass("keyinput")
            .addClass("stretch-" + element.stretch)
            .appendTo($form);

        let $input = $("<input>")
            .attr("type", "text")
            .attr("id", this.config.id + "-" + element.id)
            .attr("readonly", "")
            .val(element.value)
            .appendTo($inputContainer);

        let $recordbutton = $("<button>")
            .attr("type", "button")
            .attr("id", this.config.id + "-" + element.id + "-copy")
            .html(`<i class="far fa-keyboard"></i>`)
            .appendTo($inputContainer);

        let occupied = false;
        $($recordbutton).click(function (event) {
            if (occupied) return;
            occupied = true;

            let $oldKey = $input.val();
            $input
                .addClass("input-info")
                .val("Recording");

            HotkeyCustomizer.recordSingleKeypress(function (key: string) {
                if (key.includes("escape")) {
                    $input
                        .removeClass("input-info")
                        .val($oldKey);
                    occupied = false;
                }
                else if (HotkeyCustomizer.isRegistered(key)) {
                    $input.val("Already Taken");
                    setTimeout(() => {
                        $input
                            .removeClass("input-info")
                            .val($oldKey);
                        occupied = false;
                    }, 1000);
                }
                else {
                    $input
                        .removeClass("input-info")
                        .val(key)
                        .trigger("re621:form:keychange", [key, $oldKey]);
                    occupied = false;
                }
            });
        });

        return $input;
    }

    /**
     * Builds and appends an icon selector element
     * @param $form Form to append the element to
     * @param element Element configuration data
     */
    private buildIconInput($form: JQuery<HTMLElement>, element: FormElement) {
        let labeled = false;
        if (element.label) {
            $("<label>")
                .attr("for", this.config.id + "-" + element.id)
                .html(element.label)
                .appendTo($form);
            labeled = true;
        } else if (element.stretch === "default") { element.stretch = "column"; }

        let $inputContainer = $("<div>")
            .addClass("input-container")
            .toggleClass("labeled", labeled)
            .addClass("stretch-" + element.stretch)
            .appendTo($form);

        let $input = $("<input>")
            .attr("type", "text")
            .attr("id", this.config.id + "-" + element.id)
            .css("display", "none")
            .val(element.value)
            .appendTo($inputContainer);

        let $selectContainer = $("<div>")
            .addClass("icon-picker")
            .appendTo($inputContainer);


        element.data.forEach((icon) => {
            $("<a>")
                .attr("href", "#")
                .attr("data-value", icon.value)
                .html(icon.name)
                .appendTo($selectContainer);
        });

        $selectContainer.find("a").click((event) => {
            event.preventDefault();
            $selectContainer.find("a").removeClass("active");
            let $target = $(event.target);
            $input.val($target.attr("data-value"));
            $target.addClass("active");
        });

        if (element.value === "") { $selectContainer.find("a").first().click(); }
        else { $selectContainer.find("a[data-value='" + element.value + "']").first().click(); }

        $input.on("re621:form:update", () => {
            if ($input.val() == "") { $selectContainer.find("a").first().click(); }
            else { $selectContainer.find("a[data-value='" + $input.val() + "']").first().click(); }
        });

        if (element.pattern) { $input.attr("pattern", element.pattern); }
        if (element.required) { $input.attr("required", ""); }

        return $input;
    }

    /**
     * Builds and appends a checkbox element
     * @param $form Form to append the element to
     * @param element Element configuration data
     */
    private buildCheckbox($form: JQuery<HTMLElement>, element: FormElement) {
        if (element.stretch === "default") { element.stretch = "column"; }

        let $inputContainer = $("<div>")
            .addClass("input-container")
            .addClass("checkbox-switch")
            .addClass("stretch-" + element.stretch)
            .appendTo($form);

        if (element.label) {
            $("<label>")
                .attr("for", this.config.id + "-" + element.id)
                .html(element.label)
                .appendTo($inputContainer);
        }

        let $input = $("<input>")
            .attr("type", "checkbox")
            .attr("id", this.config.id + "-" + element.id)
            .addClass("switch")
            .attr("checked", element.value)
            .appendTo($inputContainer);

        $("<label>")
            .attr("for", this.config.id + "-" + element.id)
            .addClass("switch")
            .appendTo($inputContainer);

        return $input;
    }

    /**
     * Builds and appends a button element
     * @param $form Form to append the element to
     * @param element Element configuration data
     */
    private buildButton($form: JQuery<HTMLElement>, element: FormElement) {
        let labeled = false;
        if (element.label) {
            $("<label>")
                .attr("for", this.config.id + "-" + element.id)
                .html(element.label)
                .appendTo($form);
            labeled = true;
        }

        let $inputContainer = $("<div>")
            .addClass("input-container")
            .toggleClass("labeled", labeled)
            .addClass("stretch-" + element.stretch)
            .appendTo($form);

        let $input = $("<button>")
            .attr("type", "button")
            .attr("id", this.config.id + "-" + element.id)
            .html(element.value)
            .appendTo($inputContainer);

        if (element.pattern) { $input.attr("pattern", element.pattern); }
        if (element.required) { $input.attr("required", ''); }

        return $input;
    }

    /**
     * Builds and appends a submit button
     * @param $form Form to append the element to
     * @param element Element configuration data
     */
    private buildSubmit($form: JQuery<HTMLElement>, element: FormElement) {
        let labeled = false;
        if (element.label) {
            $("<label>")
                .attr("for", this.config.id + "-" + element.id)
                .html(element.label)
                .appendTo($form);
            labeled = true;
        }

        let $inputContainer = $("<div>")
            .addClass("input-container")
            .toggleClass("labeled", labeled)
            .addClass("stretch-" + element.stretch)
            .appendTo($form);

        let $input = $("<button>")
            .attr("type", "submit")
            .attr("id", this.config.id + "-" + element.id)
            .html(element.value)
            .appendTo($inputContainer);

        if (element.pattern) { $input.attr("pattern", element.pattern); }
        if (element.required) { $input.attr("required", ''); }

        return $input;
    }

    /**
     * Builds and appends a textarea
     * @param $form Form to append the element to
     * @param element Element configuration data
     */
    private buildTextarea($form: JQuery<HTMLElement>, element: FormElement) {
        let labeled = false;
        if (element.label) {
            $("<label>")
                .attr("for", this.config.id + "-" + element.id)
                .html(element.label)
                .appendTo($form);
            labeled = true;
        } else if (element.stretch === "default") { element.stretch = "column"; }

        let $inputContainer = $("<div>")
            .addClass("input-container")
            .toggleClass("labeled", labeled)
            .addClass("stretch-" + element.stretch)
            .appendTo($form);

        let $input = $("<textarea>")
            .attr("id", this.config.id + "-" + element.id)
            .val(element.value)
            .appendTo($inputContainer);

        if (element.pattern) { $input.attr("pattern", element.pattern); }
        if (element.required) { $input.attr("required", ''); }

        return $input;
    }

    /**
     * Builds and appends a select
     * @param $form Form to append the element to
     * @param element Element configuration data
     */
    private buildSelect($form: JQuery<HTMLElement>, element: FormElement) {
        let labeled = false;
        if (element.label) {
            $("<label>")
                .attr("for", this.config.id + "-" + element.id)
                .html(element.label)
                .appendTo($form);
            labeled = true;
        } else if (element.stretch === "default") { element.stretch = "column"; }

        let $inputContainer = $("<div>")
            .addClass("input-container")
            .toggleClass("labeled", labeled)
            .addClass("stretch-" + element.stretch)
            .appendTo($form);

        let $input = $("<select>")
            .attr("id", this.config.id + "-" + element.id)
            .appendTo($inputContainer);

        element.data.forEach(function (entry) {
            $("<option>").val(entry.value).text(entry.name).appendTo($input);
        });

        $input.val(element.value);

        if (element.required) { $input.attr("required", ''); }

        return $input;
    }

    /**
     * Builds and appends a div
     * @param $form Form to append the element to
     * @param element Element configuration data
     */
    private buildDiv($form: JQuery<HTMLElement>, element: FormElement) {
        let labeled = false;
        if (element.label) {
            $("<label>")
                .attr("for", this.config.id + "-" + element.id)
                .html(element.label)
                .appendTo($form);
            labeled = true;
        } else if (element.stretch === "default") { element.stretch = "column"; }

        let $inputContainer = $("<div>")
            .addClass("input-container")
            .toggleClass("labeled", labeled)
            .addClass("stretch-" + element.stretch)
            .appendTo($form);

        let $input = $("<div>")
            .addClass("input-div")
            .attr("id", this.config.id + "-" + element.id)
            .append(element.value)
            .appendTo($inputContainer);

        return $input;
    }

    /**
     * Builds and appends an HR element
     * @param $form Form to append the element to
     * @param element Element configuration data
     */
    private buildHr($form: JQuery<HTMLElement>, element: FormElement) {
        let labeled = false;
        if (element.label) {
            $("<label>")
                .attr("for", this.config.id + "-" + element.id)
                .html(element.label)
                .appendTo($form);
            labeled = true;
        } else if (element.stretch === "default") { element.stretch = "column"; }

        let $inputContainer = $("<div>")
            .addClass("input-container")
            .toggleClass("labeled", labeled)
            .addClass("stretch-" + element.stretch)
            .appendTo($form);

        let $input = $("<hr>")
            .attr("id", this.config.id + "-" + element.id)
            .appendTo($inputContainer);

        return $input;
    }

}

interface FormConfig {
    /** Unique ID for the form */
    id: string,
    /** Number of columns that the form should take up */
    columns?: number,
    /** Nearest static parent, for improved performance */
    parent?: string,
}

interface FormElement {
    /** Unique ID for the element. Actual ID becomes formID_elementID */
    id?: string,
    /** Supported input type */
    type: "input" | "copyinput" | "keyinput" | "icon" | "checkbox" | "button" | "submit" | "textarea" | "select" | "div" | "hr",

    stretch?: "default" | "column" | "mid" | "full",

    /** Input label */
    label?: string,
    /** Default value for the input */
    value?: string | any,

    /** If true, the field is required to submit the form */
    required?: boolean,
    /** Pattern that the input value must match */
    pattern?: string,

    /** Value-name pairs for the select */
    data?: { value: string, name: string }[],
}