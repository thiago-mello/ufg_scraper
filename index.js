const { getTeachersList, getTeacherDetailedData, writeTeachersToJSON } = require('./teachers');

(async () => {
    writeTeachersToJSON();
})();