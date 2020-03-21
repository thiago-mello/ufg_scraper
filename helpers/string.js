function titleCase(string) {
    return string.replace(
        /\w\S*/g, txt => (txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()));
}

exports.titleCase = titleCase;