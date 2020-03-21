const puppeteer = require('puppeteer');
const fs = require('fs');
const { resolve } = require('path');

const { titleCase } = require('../helpers/string');
const departmentFilePath = resolve('files', 'departments.json');
const filePath = resolve('files', 'teachers.json');

async function getTeachersList(value) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto('https://sigaa.sistemas.ufg.br/sigaa/public/docente/busca_docentes.jsf?aba=p-academico');
    await page.select('select', value);

    await page.click('#form\\:buscar');
    await page.waitForSelector('table');
    setTimeout(() => { }, 2000);

    const teachers = await page.evaluate(() => {
        const names = Array.from(document.querySelectorAll('.listagem td .nome')).map(name => name.textContent)
        const urls = Array.from(document.querySelectorAll('.listagem td .pagina a')).map(link => link.href);

        const teachers = names.map((name, index) => {
            return {
                name,
                pageUrl: urls[index],
            }
        });

        return teachers;
    });
    await browser.close();
    return teachers.map(teacher => ({ name: titleCase(teacher.name), pageUrl: teacher.pageUrl }));
}

async function getTeacherDetailedData(teacher) {
    console.log('Buscando dados de:', teacher.name);
    const { pageUrl } = teacher;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(pageUrl);

    const data = await page.evaluate(() => {
        const photoUrl = document.querySelector('#left .foto_professor img').src;
        let lattesURL = document.querySelector('#endereco-lattes')
        lattesURL = lattesURL ? lattesURL.href : null;

        let email = Array.from(document.querySelectorAll('#contato dd'))[3];
        email = email.textContent.replace(/[\t\n\r]/gm, '').split(' ').join('');

        return { photoUrl, lattesURL, email }
    });

    await browser.close();
    return {
        ...teacher,
        ...data,
    }
}

async function writeTeachersToJSON() {
    const departmentFile = fs.readFileSync(departmentFilePath);
    const departments = JSON.parse(departmentFile);

    let teachersObject = departments.map(dep => ({ department: dep.name }));

    for (const [index, dep] of departments.entries()) {
        const teachers = await getTeachersList(dep.value);
        const teachersDetailed = []

        for (teacher of teachers) {
            teachersDetailed.push((await getTeacherDetailedData(teacher)));
        }

        teachersObject[index] = { ...teachersObject[index], teachers: teachersDetailed };
    }

    const jsonData = JSON.stringify(teachersObject);
    fs.writeFile(filePath, jsonData, (err) => { if (err) console.log(err) });
}

exports.getTeachersList = getTeachersList;
exports.getTeacherDetailedData = getTeacherDetailedData;
exports.writeTeachersToJSON = writeTeachersToJSON;