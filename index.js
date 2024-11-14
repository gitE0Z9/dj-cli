class Python {
    constructor() {
        this.console = {}
    }

    async start() {
        this.console = await loadPyodide({
            stdout: (msg) => console.log(`Pyodide: ${msg}`)
        });
    }
}

const program = new Python()

async function runScript(script) {
    return await program.console.runPythonAsync(script)
}

async function runDjangoAdminCommand(command, ...args) {
    return await runScript(`
        import sys
        from django.core.management import execute_from_command_line
  
        try:
          sys.argv = ['django-admin', '${command}', '${args.join("', '")}']
          execute_from_command_line(sys.argv)
        except Exception as e:
          print(f"An error occurred: {e}")
      `)
}


async function runDjangoCommand(command, ...args) {
    return await runScript(`
        from django.core.management import call_command
  
        try:
          call_command('${command}', '${args.join("', '")}')
        except Exception as e:
          print(f"An error occurred: {e}")
      `)
}

function listDir(dir) {
    return program.console.FS.readdir(`./${dir}`).filter(file => file !== '.' && file !== '..')
}

function chdir(dir) {
    return program.console.FS.chdir(dir)
}

async function chmodRecursive(path, mode) {
    await runScript(`
        import os

        def chmod_recursive(path, mode):
            """
            Recursively sets permissions on all files and directories under the specified path.
            
            Args:
                path (str): The root path to apply permissions to.
                mode (int): The permission mode to set, in octal (e.g., 0o755).
            """
            for root, dirs, files in os.walk(path):
                # Change the permission of the directory itself
                os.chmod(root, mode)
                
                # Change the permission of each file in the directory
                for filename in files:
                    file_path = os.path.join(root, filename)
                    os.chmod(file_path, mode)
        
        chmod_recursive("${path}", 0o${mode})
        `)
}

async function isFile(path) {
    await chmodRecursive(path, 500)
    return await runScript(`from pathlib import Path; Path("${path}").is_file()`)
}

async function loadFile(path) {
    program.console.FS.chmod(path, 400)
    return program.console.FS.readFile(path, { encoding: "utf8" })
}

async function saveFile(path, content) {
    await chmodRecursive(path, 600)
    return program.console.FS.writeFile(path, content)
}

async function downloadProject() {
    await chmodRecursive(".", 500)

    const projectName = loadValue(storeKeys.projectName)
    const zipFileBase64 = await runScript(`
        import io
        import os
        import zipfile
        import base64

        zip_buffer = io.BytesIO()

        def package_django_project(project_dir):
            # Create an in-memory zip file
            zip_buffer = io.BytesIO()
            
            # Create a ZipFile object in write mode
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
                # Walk through all the files and folders in the project directory
                for root, _, files in os.walk(project_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        # Add file to the zip, with an arcname to maintain relative paths
                        arcname = os.path.relpath(file_path, project_dir)
                        zipf.write(file_path, arcname)
                    
            zip_buffer.seek(0)
        
            # Encode zip file as base64 to send it to JavaScript
            return base64.b64encode(zip_buffer.getvalue()).decode("utf-8")
        
        package_django_project(".")
        `)

    const zipBlob = await fetch(`data:application/zip;base64,${zipFileBase64}`).then(res => res.blob());
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(zipBlob);
    downloadLink.download = `${projectName}.zip`;
    downloadLink.click();
}