const fs = require('fs');
const path = require('path');

const base = 'c:/Mamah/laundry-suite/app';
const pairs = [
  ['(admin)', 'admin'],
  ['(user)', 'user']
];

pairs.forEach(([oldName, newName]) => {
  const oldPath = path.join(base, oldName);
  const newPath = path.join(base, newName);
  if (fs.existsSync(oldPath)) {
    try {
      fs.renameSync(oldPath, newPath);
      console.log(`Renamed ${oldName} to ${newName}`);
    } catch (e) {
      console.error(`Failed to rename ${oldName}: ${e.message}`);
    }
  } else {
    console.log(`${oldName} does not exist.`);
  }
});
