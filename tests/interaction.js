function switchTheme() {
    if (document.body.classList.contains('light')) {
        document.body.classList.replace('light', 'dark');
    } else {
        if (document.body.classList.contains('dark')) {
            document.body.classList.replace('dark', 'light');
        } else document.body.classList.add('light');
    }
}