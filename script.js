// Read values from the URL

const params = new URLSearchParams(window.location.search);

// Replace every {{Placeholder}} on the page

document.body.innerHTML = document.body.innerHTML.replace(
    /\{\{(.*?)\}\}/g,
    (_, key) => {

        const value = params.get(key.trim());

        return value ?? "";

    }
);
