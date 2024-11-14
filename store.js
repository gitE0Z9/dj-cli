const storeKeys = {
    projectName: "projectName",
}

function loadValue(key) {
    return localStorage.getItem(key)
}


function saveValue(key, value) {
    return localStorage.setItem(key, value)
}

function removeKey(key) {
    return localStorage.removeItem(key)
}