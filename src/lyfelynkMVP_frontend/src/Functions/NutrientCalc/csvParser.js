export const parseCSV = (csvText) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
  
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((obj, header, index) => {
        let value = values[index];
        // Convert numeric values to numbers
        if (!isNaN(value) && value !== '') {
          value = Number(value);
        }
        obj[header.trim()] = value;
        return obj;
      }, {});
    }).filter(item => item.name); // Filter out any empty rows
  };