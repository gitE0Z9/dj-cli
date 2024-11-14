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

function loadFile(path) {
    program.console.FS.chmod(path, 400)
    return program.console.FS.readFile(path, { encoding: "utf8" })
}

function saveFile(path, content) {
    program.console.FS.chmod(path, 600)
    return program.console.FS.writeFile(path, content)
}