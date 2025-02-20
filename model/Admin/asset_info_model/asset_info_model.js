

const connection = require('../../../connection/config/database')

var wkhtmltopdf = require('wkhtmltopdf');

wkhtmltopdf.command = "C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltopdf.exe";

const AssetInfoModel = {

    asset_info_create: async (req, res) => {
        try {
            const { asset_name, asset_type_id, asset_cost, note, depreciation, date, status, img, created_by
            } = req.body;
            if (!asset_name || !status) {
                return res.status(400).json({ message: 'brand name and status ID are required' });
            }


            const insertQuery = 'INSERT INTO asset_info (asset_name,	asset_type_id,	asset_cost,	note,	depreciation,	date,	status,	img	,created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
            const result = await connection.query(insertQuery, [asset_name, asset_type_id, asset_cost, note, depreciation, date, status, img, created_by]);

            // Sending only the necessary data from the result object
            const { insertId, affectedRows } = result;

            // Sending response with relevant data
            res.status(200).json({ insertId, affectedRows });

            // Using parameterized query to prevent SQL injection

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error processing the request' });
        }
    },


    asset_info_list: async (req, res) => {
        try {
            const data = "select * from  asset_info";

            connection.query(data, function (error, result) {
                console.log(result)
                if (!error) {
                    res.send(result)
                }

                else {
                    console.log(error)
                }

            })
        }
        catch (error) {
            console.log(error)
        }
    },

    asset_info_single: async (req, res) => {
        try {
            const query = 'SELECT * FROM asset_info WHERE id = ?';
            connection.query(query, [req.params.id], (error, result) => {
                if (!error && result.length > 0) {
                    console.log(result);
                    return res.send(result);
                } else {
                    console.log(error || 'Product not found');
                    return res.status(404).json({ message: 'Product not found.' });
                }
            });
        }
        catch (error) {
            console.log(error)
        }
    },


    asset_info_update: async (req, res) => {
        try {

            const { asset_name, asset_type_id, asset_cost, note, depreciation, date, status, img, modified_by
            } = req.body;

            const query = `UPDATE asset_info SET   asset_name = ?, asset_type_id = ?, asset_cost = ?, note = ?, depreciation = ?, date = ?, status = ?, img = ?,  modified_by = ? WHERE id = ?`;
            connection.query(query, [asset_name, asset_type_id, asset_cost, note, depreciation, date, status, img, modified_by, req.params.id], (error, result) => {
                if (!error && result.affectedRows > 0) {
                    console.log(result);
                    return res.send(result);
                } else {
                    console.log(error || 'Product not found');
                    return res.status(404).json({ message: 'Product not found.' });
                }
            });
        }
        catch (error) {
            console.log(error)
        }
    },


    asset_info_delete: async (req, res) => {
        try {
            const shiftId = req.params.id;

            console.log(shiftId);

            // First, check if the shift_id is referenced in employee_joining
            const checkQuery =
                "SELECT COUNT(*) AS count FROM asset_employee WHERE asset_id = ?";
            connection.query(checkQuery, [shiftId], (error, results) => {
                if (error) {
                    console.log(error);
                    return res.status(500).json({ message: "Database error" });
                }

                const isReferenced = results[0].count > 0;

                if (isReferenced) {
                    // If referenced, prevent deletion
                    return res
                        .status(400)
                        .json({ message: "Cannot delete: blood group in  use." });
                }

                // Proceed with deletion if not referenced
                const deleteQuery = "DELETE FROM asset_info WHERE id = ?";
                connection.query(
                    deleteQuery,
                    [shiftId],
                    (deleteError, deleteResult) => {
                        if (!deleteError && deleteResult.affectedRows > 0) {
                            console.log(deleteResult);
                            return res.send(deleteResult);
                        } else {
                            console.log(deleteError || "School shift not found");
                            return res
                                .status(404)
                                .json({ message: "School shift not found." });
                        }
                    }
                );
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: "Server error" });
        }
    },



    asset_info_list_paigination: async (req, res) => {
        const pageNo = Number(req.params.pageNo);
        const perPage = Number(req.params.perPage);
        try {
            const skipRows = (pageNo - 1) * perPage;
            let query = `
      SELECT asset_info.*, 
             users_created.full_name AS created_by,
             users_modified.full_name AS modified_by,
             asset_type.asset_type_name AS asset_type_name 
      FROM asset_info 
      LEFT JOIN users AS users_created ON asset_info.created_by = users_created.id 
      LEFT JOIN users AS users_modified ON asset_info.modified_by = users_modified.id 
      LEFT JOIN asset_type ON asset_info.asset_type_id = asset_type.id

      ORDER BY asset_info.id DESC
      LIMIT ?, ?
    `;

            connection.query(query, [skipRows, perPage], (error, result) => {
                console.log(result)
                if (!error) {
                    res.send(result)
                }

                else {
                    console.log(error)
                }

            })
        }
        catch (error) {
            console.log(error)
        }
    },


    asset_info_search: async (req, res) => {
        try {
            console.log("Search button clicked.");

            // Extract necessary data from request
            let { assenTypeName, status, assetType, toDate, fromDate } = req.body;

            // Construct the base SQL query
            let sql = `
             SELECT asset_info.*, 
             users_created.full_name AS created_by,
             users_modified.full_name AS modified_by,
             asset_type.asset_type_name AS asset_type_name 
            FROM asset_info 
            LEFT JOIN users AS users_created ON asset_info.created_by = users_created.id 
            LEFT JOIN users AS users_modified ON asset_info.modified_by = users_modified.id 
            LEFT JOIN asset_type ON asset_info.asset_type_id = asset_type.id
            WHERE 1`;



            if (assenTypeName) {
                sql += ` AND LOWER(asset_info.asset_name) LIKE '%${assenTypeName}%'`;
            }

            if (assetType) {
                sql += ` AND LOWER(asset_info.asset_type_id) LIKE '%${assetType}%'`;
            }

            if (status) {

                sql += ` AND asset_info.status LIKE '%${status}%'`;
            }

            if (fromDate && toDate) {
                sql += ` AND asset_info.date BETWEEN '${fromDate}' AND '${toDate}'`;
            }



            sql += ` ORDER BY asset_info.id DESC`
            // Add expense name (item_name) search condition



            console.log("SQL Query:", sql);

            // Execute the constructed SQL query
            connection.query(sql, (error, results, fields) => {
                if (error) {
                    console.error("Error occurred during search:", error);
                    res.status(500).json({ error: "An error occurred during search." });
                } else {
                    console.log("Search results:", results);
                    res.status(200).json({ results });
                }
            });
        } catch (error) {
            console.error("An error occurred:", error);
            res.status(500).json({ error: "An error occurred." });
        }
    },




    asset_info_pdf: async (req, res) => {
        try {
            const { searchResults, selectedPrintSize, orientation, fontSize } = req.body;





            console.log(searchResults, 'here all the searchResults');

            let tableRows = '';
            searchResults?.forEach((result, index) => {
                let row = '<tr>';

                // Static column setup
                row += `<td>${index + 1}</td>`; // Serial column
                row += `<td>${result.asset_name}</td>`; // Person Name
                row += `<td>${result.asset_type_name}</td>`; // Person Name
                row += `<td>${result.date.slice(0, 10)}</td>`; // Person Name
                row += `<td>${result.status === 1 ? "Active"
                    : result.status === 2 ? "Inactive"
                        : result.status === 3 ? "Pending"
                            : "Unknown"}</td>`; // Person Mobile
                row += `<td><td><img src="http://localhost/:5003/${result.img}" alt="image" style="max-width: 100px; max-height: 100px;"></td></td>`; // Person Email
                row += `<td>${result.note}</td>`; // Person Email


                row += '</tr>';
                tableRows += row;
            });

            const pageSize = selectedPrintSize || 'A4';
            const pageOrientation = orientation || 'portrait';

            const html = `<html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Document</title>
                <style>
                     @page {
                        size: ${pageSize} ${pageOrientation}; /* This sets the page size to A4 and orientation to Portrait */
                        margin: 20mm; /* Adjust the margin as needed */
                    }
                    * { 
                        font-size: ${fontSize || '12px'};
                        font-family: 'Nikosh', sans-serif !important;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    th, td {
                        padding: 8px;
                        text-align: left;
                        border: 1px solid #ddd;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                    img {
                        max-width: 100px;
                        max-height: 100px;
                    }
                    .container {
                        text-align: center;
                    }
                    .container2 {
                        display: flex;
                        justify-content: space-between;
                    }
                </style>
            </head>
            <body>
                <div class='container'>
                    <h2 style="margin: 0; padding: 0;">Pathshala School & College Expense List</h2>
                    <h3 style="margin: 0; padding: 0;">GA-75/A, Middle Badda, Dhaka-1212</h3>
                    <p style="margin: 0; padding: 0;">Phone: 01977379479, Mobile: 01977379479</p>
                    <p style="margin: 0; padding: 0; margin-bottom: 10px">Email: pathshala@urbanitsolution.com</p>
                    <h3 style="margin-bottom: 10px; padding: 0; text-decoration: underline;">Expense List</h3>
                </div>
                <div class="container2">
                    <p style="margin: 0; padding: 0;">Receipt No: 829</p>
                    <p style="margin: 0; padding: 0;">Collected By:</p>
                    <p style="margin: 0; padding: 0;">Date: </p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>SL No.</th>
                            <th>Asset Name</th>
                            <th>Asset Type Name</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Img</th>
                            <th>Note</th>
                            
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </body>
            </html>`;

            wkhtmltopdf(html, { pageSize: pageSize, orientation: pageOrientation }, (err, stream) => {
                if (err) {
                    console.error('Error generating PDF:', err);
                    res.status(500).send('Error generating PDF');
                    return;
                }
                stream.pipe(res);
            });
        } catch (error) {
            console.error('Error in expense_pdf:', error);
            res.status(500).send('Error generating PDF');
        }
    },



    asset_info_print: async (req, res) => {
        try {
            const { searchResults, selectedPrintSize, orientation, fontSize, extraColumnValue } = req.body;




            console.log(searchResults, 'here all the searchResults');

            let tableRows = '';
            searchResults?.forEach((result, index) => {
                let row = '<tr>';

                // Static column setup
                row += `<td>${index + 1}</td>`; // Serial column
                row += `<td>${result.asset_name}</td>`; // Person Name
                row += `<td>${result.asset_type_name}</td>`; // Person Name
                row += `<td>${result.date.slice(0, 10)}</td>`; // Person Name
                row += `<td>${result.status === 1 ? "Active"
                    : result.status === 2 ? "Inactive"
                        : result.status === 3 ? "Pending"
                            : "Unknown"}</td>`; // Person Mobile
                row += `<td><img src="http://localhost/:5003/${result.img}" alt="image" style="max-width: 100px; max-height: 100px;"></td>`; // Person Email
                row += `<td>${result.note}</td>`; // Person Email
                for (let i = 1; i <= extraColumnValue; i++) {
                    row += `<td contenteditable="true">Extra Column ${i}</td>`; // Editable extra column
                }

                row += '</tr>';
                tableRows += row;
            });

            const pageSize = selectedPrintSize || 'A4';
            const pageOrientation = orientation || 'portrait';

            const html = `<html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Document</title>
                <style>
                    @page {
                        size: ${pageSize} ${pageOrientation}; /* This sets the page size and orientation */
                        margin: 20mm; /* Adjust the margin as needed */
                    }
                    * { 
                        font-size: ${fontSize || '12px'};
                        font-family: 'Nikosh', sans-serif !important;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    th, td {
                        padding: 8px;
                        text-align: left;
                        border: 1px solid #ddd;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                    img {
                        max-width: 100px;
                        max-height: 100px;
                    }
                    .container {
                        text-align: center;
                    }
                    .container2 {
                        display: flex;
                        justify-content: space-between;
                    }
                </style>
            </head>
            <body>
                <div class='container'>
                    <h2 style="margin: 0; padding: 0;">Pathshala School & College Visit List</h2>
                    <h3 style="margin: 0; padding: 0;">GA-75/A, Middle Badda, Dhaka-1212</h3>
                    <p style="margin: 0; padding: 0;">Phone: 01977379479, Mobile: 01977379479</p>
                    <p style="margin: 0; padding: 0; margin-bottom: 10px">Email: pathshala@urbanitsolution.com</p>
                    <h3 style="margin-bottom: 10px; padding: 0; text-decoration: underline;">Visit List</h3>
                </div>
                <div class="container2">
                    <p style="margin: 0; padding: 0;">Receipt No: 829</p>
                    <p style="margin: 0; padding: 0;">Collected By:</p>
                    <p style="margin: 0; padding: 0;">Date: </p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>SL No.</th>
                            <th>Asset Name</th>
                            <th>Asset Type Name</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Img</th>
                            <th>Note</th>
                            ${[...Array(extraColumnValue)].map((_, i) => `<th contenteditable="true">Extra Column ${i + 1}</th>`).join('')} <!-- Dynamically add headers -->
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </body>
            <script>
                window.print();
            </script>
            </html>`;

            res.send(html); // Send the HTML directly to the client
        } catch (error) {
            console.error('Error in office_visit_person_print:', error);
            res.status(500).send('Error generating print view');
        }
    },



}

module.exports = AssetInfoModel