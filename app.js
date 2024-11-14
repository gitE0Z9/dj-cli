async function setUpPyodide() {
    // display loading spin
    dialogs.screenProgressDialog.show();

    // loading pyodide
    elements.screenProgressEvent.textContent = "loading python...";
    await program.start()

    // display pip installation
    elements.screenProgressEvent.textContent = "loading pip...";
    elements.screenProgressBar.style.width = `25%`;
    elements.screenProgressBar.textContent = `25%`;
    await program.console.loadPackage("micropip");
    const micropip = program.console.pyimport("micropip");

    // display django installation
    elements.screenProgressEvent.textContent = "installing django...";
    elements.screenProgressBar.style.width = `50%`;
    elements.screenProgressBar.textContent = `50%`;
    await micropip.install("django");

    elements.screenProgressEvent.textContent = "Name your project";
    elements.screenProgressBar.style.width = `75%`;
    elements.screenProgressBar.textContent = `75%`;
    toggleFade(elements.screenProgressSpinnerContainer, false);
    toggleFade(elements.screenProgressInputContainer, true);
    toggleFade(elements.screenProgressDialogFooter, true);
    toggleButton(elements.createProjectTrigger, true);
}

async function main() {
    registerEvenets();
    await setUpPyodide();
}

main();