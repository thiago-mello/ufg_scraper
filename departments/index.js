const puppeteer = require('puppeteer');
const fs = require('fs');
const { resolve } = require('path');

const { titleCase } = require('../helpers/string');
const filePath = resolve('files', 'departments.json');

async function getDepartmentsList() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://sigaa.sistemas.ufg.br/sigaa/public/docente/busca_docentes.jsf?aba=p-academico');

    const departments = await page.evaluate(() => {
        const departments = Array.from(document.querySelectorAll('#form\\:departamento option'));
        return departments.map(dep => ({ name: dep.textContent, value: dep.value }));
    });

    return departments.map(dep => ({
        name: titleCase(dep.name.split('-')[0]),
        value: dep.value,
    }))
}

async function writeDepartmentsToJSON() {
    const departments = await getDepartmentsList();
    const jsonDepartments = JSON.stringify(departments)
    fs.writeFile(filePath, jsonDepartments, (err) => { if (err) console.log(err) });
}

(async () => {
    await writeDepartmentsToJSON();
})();
