
# truto-jsonata

`truto-jsonata` is a TypeScript/JavaScript library that extends the capabilities of [JSONata](https://www.npmjs.com/package/jsonata) with a rich set of custom functions for data transformation, text conversion, cryptographic operations, and utility functions. It simplifies complex data manipulation tasks, making it easier to work with JSON data in Node.js applications.
  
## Table of Contents

- [Features](#features)

- [Requirements](#requirements)

- [Installation](#installation)

- [Usage](#usage)

- [Custom Functions](#custom-functions)

  - [Data Transformation and Utility Functions](data-transformation-and-utility-functions)

  - [Markdown and Text Conversion](#markdown-and-text-conversion)

  - [Array and Object Utilities (Lodash Enhancements)](#array-and-object-utilities-lodash-enhancements)

  - [Parsing and URL Functions](#parsing-and-url-functions)

  - [Miscellaneous](#miscellaneous)

## Features

- **Enhanced JSONata Expressions**: Adds custom functions to JSONata expressions for advanced data manipulation.

- **Data Transformation**: Functions for date parsing, currency conversion, and object manipulation.

- **Text Conversion**: Convert between Markdown, HTML, Notion, Slack, and Google Docs formats.

- **Cryptographic Operations**: Generate digests and signatures.

- **Utility Functions**: Lodash-inspired array and object utilities.

- **Parsing Utilities**: URL parsing and JSON parsing functions.

- **Miscellaneous**: Functions for similarity checks, node sorting, and more.

## Requirements

- **Node.js**: Version 22 or higher.

- **TypeScript**: (Optional) If you're using TypeScript in your project.

## Installation

Install the package using npm:

```bash
npm i @truto/truto-jsonata
```

Or with yarn:

```bash
yarn add @truto/truto-jsonata
```

## Usage

To use `truto-jsonata`, import the default function and pass your JSONata expression as a string. This function returns an `Expression` object with all custom functions registered.

```javascript

import trutoJsonata from '@truto/truto-jsonata';
cons expressionString = 'your JSONata expression here';
const expression = trutoJsonata(expressionString);

// Evaluate the expression with your data
const data = { /* your data object */ };
const result = expression.evaluate(data);
```

Alternatively, if you already have a JSONata expression and want to register the custom functions:

```javascript

import jsonata  from  'jsonata';
import registerJsonataExtensions  from  '@truto/truto-jsonata/registerJsonataExtensions';
const expression = jsonata('your expression');

registerJsonataExtensions(expression);
// Now you can use custom functions in your expression
```

## Custom Functions

Below is a detailed list of all custom functions added to JSONata expressions, along with examples demonstrating how to use each one.

### Data Transformation and Utility Functions

<details>
<summary>  dtFromIso(datetimeString)</summary>

Converts an ISO date-time string to a [Luxon DateTime](https://moment.github.io/luxon/api-docs/index.html#datetime) object.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata'

const expression = trutoJsonata("$dtFromIso('2024-11-05T12:00:00Z')");
expression.evaluate({}).then(result => { console.log(result)});
// Output: DateTime { ts: 2024-11-05T12:00:00.000+00:00, zone: UTC, locale: en-US }
```

</details>

<details>
<summary> dtFromFormat(datetimeString, format)</summary>

Parses a date-time string according to the specified format and returns a [Luxon DateTime](https://moment.github.io/luxon/api-docs/index.html#datetime) object.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata'

const expression = trutoJsonata("$dtFromFormat('01-11-2022 12:00', 'dd-MM-yyyy HH:mm')");
expression.evaluate({}).then(result => { console.log(result });
// Output: DateTime { ts: 2022-11-01T12:00:00.000+00:00, zone: UTC, locale: en-US }
```

</details>

<details>
<summary> removeEmptyItems(array)</summary>

Filters out empty objects from an array.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const data = [{}, { a: 1 }, []];
const expression = trutoJsonata("$removeEmptyItems(data)");
expression.evaluate({ data }).then(result => { console.log(result); });
//Output: [ { a: 1 } ]
```

</details>

<details>
<summary> removeEmpty(object)</summary>

Removes all properties with empty values (`null`, `undefined`, empty string, empty array) from an object.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const data =   ["1", "2", "3", ""];
const blankData = []
let expression = trutoJsonata("$removeEmpty(data)");
expression.evaluate({ data }).then(result => { console.log(result); });

//another example
expression = trutoJsonata("$removeEmpty(blankData)");
expression.evaluate({ blankData }).then(result => { console.log(result); });
/* Output: 
[ "1", "2", "3", "" ]
undefined 
*/
```

</details>

<details>
<summary>convertCurrencyToSubunit(amount, currencyCode)</summary>

Converts a currency amount to its smallest subunit (e.g., dollars to cents).

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const expression = trutoJsonata("$convertCurrencyToSubunit(5.50, 'USD')");
expression.evaluate({}).then(result => { console.log(result); });
// Output: 550
```

</details>

<details>
<summary>convertCurrencyFromSubunit(amountInSubunit, currencyCode)</summary>

Converts an amount in subunits back to the main currency unit.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const expression = trutoJsonata("$convertCurrencyFromSubunit(550, 'USD')");
expression.evaluate({}).then(result => { console.log(result); });
// Output: 5.50
```

</details>

<details>
<summary>convertQueryToSql(query, keysToMap = [], mapping = {}, dataTypes = {}, customOperatorMapping = {}, options = {})</summary>


Converts a query object into an SQL query string.

**Parameters**:

- **`query`**  
  The query object to be converted into SQL.  

- **`keysToMap`** _(Optional)_  
  A list of keys that should be processed in the SQL conversion.  
- **`mapping`** _(Optional)_  
  An object to map the original keys to SQL-compatible keys.  
- **`dataTypes`** _(Optional)_  
  An object that specifies the data type for each field in the query.  

  Supported Data Types:

  - `string`
  - `double_quote_string`
  - `number`
  - `boolean`
  - `dotnetdate`

- **`customOperatorMapping`** _(Optional)_  
  An object to provide a custom mapping for operators (e.g., replacing `eq` with `=`).  

- **`options`** _(Optional)_  
  An object providing additional options for the conversion.  

   Supported Options:

    - **`useOrForIn`** _(Boolean)_: Use `OR` instead of `IN` for array comparisons.  
      default: `false`
    - **`conjunction`** _(String)_: Logical conjunction for combining conditions (`'AND'` or `'OR'`).  
      default: `'AND'`
    - **`useDoubleQuotes`** _(Boolean)_: Use double quotes for string values.  
      default: `false`
    - **`noSpaceBetweenOperator`** _(Boolean)_: No space between operators and values.  
      default: `false`
    - **`noQuotes`** _(Boolean)_: Do not use quotes around string values.  
      default: `false`
    - **`noQuotesForDate`** _(Boolean)_: No quotes for date values.  
      default: `false`
    - **`groupComparisonInBrackets`** _(Boolean)_: Group comparisons in brackets.  
      default: `false`
    - **`escapeSingleQuotes`** _(Boolean)_: Escape single quotes within string values.  
      default: `false`

  ***Supported Operators***:

  - **`eq`**: Equals (`=`)  
  - **`ne`**: Not Equals (`<>`)  
  - **`gt`**: Greater Than (`>`)  
  - **`gte`**: Greater Than or Equal (`>=`)  
  - **`lt`**: Less Than (`<`)  
  - **`lte`**: Less Than or Equal (`<=`)  
  - **`in`**: In List (`IN`)  
  - **`nin`**: Not In List (`NOT IN`)  
  - **`like`**: Like (`LIKE`)  

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

// Example 1: Basic usage with common operators
const data1 = {
  name: { eq: 'John' },
  age: { gte: '30' },
};

const expression1 = trutoJsonata("$convertQueryToSql(data)");
expression1.evaluate({ data: data1 }).then(result => {
  console.log(result);
  // Output: name = 'John' AND age >= 30 
});

// Example 2: Using 'like' operator
const data2 = {
    name: { like: 'John' },
};

const expression2 = trutoJsonata("$convertQueryToSql(data)");
expression2.evaluate({ data: data2 }).then(result => {
  console.log(result);
  // Output: (name = 'John' OR name = 'Jane')
});

// Example 3: Using 'lt' and 'lte' operators
const data3 = {
  price: { lt: 100 },
  discount: { lte: 20 },
};

const expression3 = trutoJsonata("$convertQueryToSql(data)");
expression3.evaluate({ data: data3 }).then(result => {
  console.log(result);
  // Output: price < 100 AND discount <= 20
});

// Example 4: Using 'gt' and 'gte' operators
const data4 = {
  rating: { gt: 4 },
  reviews: { gte: 100 },
};

const expression4 = trutoJsonata("$convertQueryToSql(data)");
expression4.evaluate({ data: data4 }).then(result => {
  console.log(result);
  // Output: rating > 4 AND reviews >= 100
});

// Example 5: Using 'ne' (not equal) operator
const data5 = {
  status: { ne: 'inactive' },
};

const expression5 = trutoJsonata("$convertQueryToSql(data)");
expression5.evaluate({ data: data5 }).then(result => {
  console.log(result);
  // Output: status <> inactive
});

// Example 6: Using 'nin' (not in) operator
const data6 = {
  category: { nin: ['Electronics', 'Furniture'] },
};

const expression6 = trutoJsonata("$convertQueryToSql(data)");
expression6.evaluate({ data: data6 }).then(result => {
  console.log(result);
  // Output: category NOT IN ('Electronics','Furniture')
});

// Example 7: Using 'startswith', 'endswith', and 'contains' operators
const data = {
  title: { in: ['Intro to Programming', 'Intro to JavaScript'] },
  author: { eq: 'Smith' },
};

const expression = trutoJsonata("$convertQueryToSql(data)");
expression.evaluate({ data }).then(result => {
  console.log(result);
  // Output: title IN ('Intro to Programming','Intro to JavaScript') AND author = 'Smith'
});


// Example 8: Using custom operator mapping
const customOperatorMapping = {
  eq: '=',
  ne: '<>',
  lt: '<',
  lte: '<=',
  gt: '>',
  gte: '>=',
  in: 'IN',
  nin: 'NOT IN',
  startswith: 'LIKE',
  endswith: 'LIKE',
  contains: 'LIKE',
};

const data8 = {
  status: { ne: 'inactive' },
};

const expression8 = trutoJsonata("$convertQueryToSql(data, [], {}, {}, customOperatorMapping)");
expression8.evaluate({ data: data8, customOperatorMapping }).then(result => {
  console.log(result);
  // Output: status <> 'inactive'
});

// Example 9: Using data types
const dataTypes = {
  created_at: 'string',
};

const data9 = {
  created_at: { eq: '2021-01-01' },
};

const expression9 = trutoJsonata("$convertQueryToSql(data, [], {}, {}, dataTypes)");
expression9.evaluate({ data: data9, dataTypes }).then(result => {
  console.log(result);
  // Output: created_at = '2021-01-01'
});

// Example 10: Using mapping for keys
const mapping = {
  firstName: 'first_name',
  lastName: 'last_name',
};

const data10 = {
  firstName: { eq: 'John' },
  lastName: { eq: 'Doe' },
};

const expression10 = trutoJsonata("$convertQueryToSql(data, [], mapping, {}, {}, {})");
expression10.evaluate({ data: data10, mapping }).then(result => {
  console.log(result);
  // Output: first_name = 'John' AND last_name = 'Doe'
});

// Example 11: Using options (e.g., conjunction, groupComparisonInBrackets)
const options = {
  conjunction: 'OR',
  groupComparisonInBrackets: true,
};

const data11 = {
  name: { eq: 'Alice' },
  city: { eq: 'Wonderland' },
};

const expression11 = trutoJsonata("$convertQueryToSql(data, [], {}, {}, {}, options)");
expression11.evaluate({ data: data11, options }).then(result => {
  console.log(result);
  // Output: (name = 'Alice' OR city = 'Wonderland')
});

// Example 12: Using 'useOrForIn' option
const options12 = {
  useOrForIn: true,
};

const data12 = {
  id: { in: [1, 2, 3] },
};

const expression12 = trutoJsonata("$convertQueryToSql(data, [], {}, {}, {}, options)");
expression12.evaluate({ data: data12, options: options12 }).then(result => {
  console.log(result);
  // Output: (id = 1 OR id = 2 OR id = 3)
});

// Example 13: Handling 'noQuotes' and 'useDoubleQuotes' options
const options13 = {
  noQuotes: true,
  useDoubleQuotes: true,
};

const data13 = {
  category: { eq: 'Books' },
};

const expression13 = trutoJsonata("$convertQueryToSql(data, [], {}, {}, {}, options)");
expression13.evaluate({ data: data13, options: options13 }).then(result => {
  console.log(result);
  // Output: category = Books
});

// Example 14: Escaping single quotes in values
const options14 = {
  escapeSingleQuotes: true,
};

const data14 = {
  name: { eq: "O'Reilly" },
};

const expression14 = trutoJsonata("$convertQueryToSql(data, [], {}, {}, {}, options)");
expression14.evaluate({ data: data14, options: options14 }).then(result => {
  console.log(result);
  // Output: name = 'O''Reilly'
});

// Example 15: Using 'noSpaceBetweenOperator' option
const options15 = {
    noSpaceBetweenOperator: true,
  };
  
  const data15 = {
    price: { gt: '100' },
  };
  
  const expression15 = trutoJsonata("$convertQueryToSql(data, [], {}, {}, {}, options)");
  expression15.evaluate({ data: data15, options: options15 }).then(result => {
    console.log(result);
    // Output: price>100
  });
  
  // Example 16: Using 'groupComparisonInBrackets' with 'AND' conjunction
  const options16 = {
    groupComparisonInBrackets: true,
    conjunction: 'AND'
  };
  
  const data16 = {
    category: { eq: 'Books' },
    availability: { eq: 'In Stock' },
  };
  
  const expression16 = trutoJsonata("$convertQueryToSql(data, [], {}, {}, {}, options)");
  expression16.evaluate({ data: data16, options: options16 }).then(result => {
    console.log(result);
    // Output: (category = 'Books' AND availability = 'In Stock')
  });
  
  // Example 17: Using 'noQuotesForDate' with a date value
  const options17 = {
    noQuotesForDate: true,
  };
  
  const data17 = {
    created_at: { eq: '2021-12-31' },
  };
  
  const dataTypes17 = {
    created_at: 'date|yyyy-MM-dd'
  };
  
  const expression17 = trutoJsonata("$convertQueryToSql(data, [], {}, dataTypes, {}, options)");
  expression17.evaluate({ data: data17, dataTypes: dataTypes17, options: options17 }).then(result => {
    console.log(result);
    // Output: created_at = 2021-12-31
  });
  
  // Example 18: Using 'useDoubleQuotes' and 'groupComparisonInBrackets' options
  const options18 = {
    useDoubleQuotes: true,
    groupComparisonInBrackets: true,
  };
  
  const data18 = {
    product: { eq: 'Laptop' },
    brand: { eq: 'Dell' },
  };
  
  const expression18 = trutoJsonata("$convertQueryToSql(data, [], {}, {}, {}, options)");
  expression18.evaluate({ data: data18, options: options18 }).then(result => {
    console.log(result);
    // Output: (product = "Laptop" AND brand = "Dell")
  });
  
  // Example 19: Using a custom conjunction ('NOR')
  const options19 = {
    conjunction: 'NOR',
  };
  
  const data19 = {
    available: { eq: 'No' },
    sold: { eq: 'Yes' },
  };
  
  const expression19 = trutoJsonata("$convertQueryToSql(data, [], {}, {}, {}, options)");
  expression19.evaluate({ data: data19, options: options19 }).then(result => {
    console.log(result);
    // Output: available = 'No' NOR sold = 'Yes'
  });
  
  // Example 20: Using 'dotnetdate' data type with 'groupComparisonInBrackets'
  const data20 = {
    modified_at: { eq: '2023-01-01T00:00:00Z' },
  };
  
  const dataTypes20 = {
    modified_at: 'dotnetdate'
  };
  
  const options20 = {
    groupComparisonInBrackets: true,
  };
  
  const expression20 = trutoJsonata("$convertQueryToSql(data, [], {}, dataTypes, {}, options)");
  expression20.evaluate({ data: data20, dataTypes: dataTypes20, options: options20 }).then(result => {
    console.log(result);
    // Output: (modified_at = DateTime(2023,01,01))
  });
  
  // Example 21: Using 'noQuotes' option for numeric comparison
  const options21 = {
    noQuotes: true,
  };
  
  const data21 = {
    rating: { gt: '4.5' },
  };
  
  const expression21 = trutoJsonata("$convertQueryToSql(data, [], {}, {}, {}, options)");
  expression21.evaluate({ data: data21, options: options21 }).then(result => {
    console.log(result);
    // Output: rating > 4.5
  });
  
  // Example 22: Combining 'useOrForIn' with custom conjunction
  const options22 = {
    useOrForIn: true,
    conjunction: 'OR',
  };
  
  const data22 = {
    productId: { in: [101, 102, 103] },
  };
  
  const expression22 = trutoJsonata("$convertQueryToSql(data, [], {}, {}, {}, options)");
  expression22.evaluate({ data: data22, options: options22 }).then(result => {
    console.log(result);
    // Output: (productId = 101 OR productId = 102 OR productId = 103)
  });
  
  // Example 23: Using 'escapeSingleQuotes' with a string that contains a single quote
  const options23 = {
    escapeSingleQuotes: true,
  };
  
  const data23 = {
    publisher: { eq: "McGraw-Hill's" },
  };
  
  const expression23 = trutoJsonata("$convertQueryToSql(data, [], {}, {}, {}, options)");
  expression23.evaluate({ data: data23, options: options23 }).then(result => {
    console.log(result);
    // Output: publisher = 'McGraw-Hill\'s'
  });
  
  // Example 24: 'noSpaceBetweenOperator' with 'gt' operator
  const options24 = {
    noSpaceBetweenOperator: true,
  };
  
  const data24 = {
    inventory: { gt: '50' },
  };
  
  const expression25 = trutoJsonata("$convertQueryToSql(data, [], {}, {}, {}, options)");
  expression25.evaluate({ data: data24, options: options24 }).then(result => {
    console.log(result);
    // Output: inventory>50
  });
  
  // Example 25: Using 'noQuotesForDate' and escaping single quotes in the same data
  const options25 = {
    noQuotesForDate: true,
    escapeSingleQuotes: true,
  };
  
  const data25 = {
    releaseDate: { eq: '2023-03-15' },
    author: { eq: "J.K. O'Rourke" },
  };
  
  const dataTypes25 = {
    releaseDate: 'date|yyyy-MM-dd'
  };
  
  const expression25 = trutoJsonata("$convertQueryToSql(data, [], {}, dataTypes, {}, options)");
  expression25.evaluate({ data: data25, dataTypes: dataTypes25, options: options25 }).then(result => {
    console.log(result);
    // Output: releaseDate = 2023-03-15 AND author = 'J.K. O\'Rourke'
  });
```

</details>

<details>
<summary>mapValues(value, mapping, lowerCase = false, defaultValue = null)</summary>

Transforms a value (object, array, string, or number) based on a provided mapping. The function applies mappings recursively and can handle case insensitivity or default values if the mapping doesn’t exist.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

// Example 1: Basic mapping with default options
const roleKey = "1";
const roleMapping = {
  "1": "owner",
  "2": "admin",
  "3": "member",
  "4": "guest"
};

// Create a JSONata expression using the $mapValues function
const roleExpression = trutoJsonata("$mapValues(roleKey, roleMapping)");

roleExpression.evaluate({ roleKey, roleMapping }).then(result => {
  console.log(result); // Output: "owner"
});

// Example 2: Using defaultValue
const roleKey2 = null;

// Create a JSONata expression with defaultValue set to 'Unknown'
const roleExpression2 = trutoJsonata("$mapValues(roleKey2, roleMapping, false, 'Unknown')");

roleExpression2.evaluate({ roleKey: roleKey2, roleMapping }).then(result => {
  console.log(result); // Output: "Unknown"
});

// Example 3: Case-insensitive mapping (lowerCase = false)
const caseInsensitiveKey = "admin";
const caseInsensitiveMapping = {
  "OWNER": "Owner",
  "ADMIN": "Administrator",
  "GUEST": "Guest"
};

// lowerCase set to false (default)
const caseInsensitiveExpression = trutoJsonata("$mapValues(caseInsensitiveKey, caseInsensitiveMapping, false)");

caseInsensitiveExpression.evaluate({ caseInsensitiveKey, caseInsensitiveMapping }).then(result => {
  console.log(result); 
  // Output: "Administrator"
  // Keys are coverted to lowerCase and matched here
});

// Example 4: Array input
const roleKeysArray = ["1", "3", "5"];

// Create a JSONata expression to map an array of role keys
const roleExpression3 = trutoJsonata("$mapValues(roleKeysArray, roleMapping)");

roleExpression3.evaluate({ roleKeysArray, roleMapping }).then(result => {
  console.log(result); // Output: ["owner", "member", "5"]
});

// Example 5: Object input with nested keys (refer roleMapping above)
const userRoles = {
  user1: "1",
  user2: "2",
  user3: "5"
};

// Create a JSONata expression to map values within an object
const roleExpression4 = trutoJsonata("$mapValues(userRoles, roleMapping)");

roleExpression4.evaluate({ userRoles, roleMapping }).then(result => {
  console.log(result); // Output: { user1: "owner", user2: "admin", user3: "5" }
});

// Example 6: Using mapValues on mixed type arrays
const mixedArray = ["1", "Admin", 500, null, undefined];

const mappingForMixedArray = {
  "1": "Owner",
  "Admin": "Administrator",
  "500": "Server Error"
};

const mixedArrayExpression = trutoJsonata("$mapValues(mixedArray, mappingForMixedArray)");

mixedArrayExpression.evaluate({ mixedArray, mappingForMixedArray }).then(result => {
  console.log(result); // Output: ["Owner", "Administrator", "Server Error", null, undefined]
});

```

</details>

<details>
<summary>zipSqlResponse(columns, data, key)</summary>

Converts an SQL response (typically with column metadata and row data) into an array of objects, where each object represents a row with column names as keys.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const columns = [
  { name: 'id' },
  { name: 'name' },
  { name: 'age' }
];
const data = [
  [1, 'Alice', 30],
  [2, 'Bob', 25],
  [3, 'Charlie', 35]
];
const key = 'name';
const expression = trutoJsonata("$zipSqlResponse(columns, data, key)");
expression.evaluate({ columns, data, key }).then(result => { console.log(result); });
/*
Output:
[
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
  { id: 3, name: 'Charlie', age: 35 }
]
*/
```

</details>

<details>
<summary> firstNonEmpty(...values)</summary>

Returns the first argument that is not `null` or `undefined.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const expression = trutoJsonata("$firstNonEmpty( null, ['3'], undefined)");
expression.evaluate({}).then(result => { console.log(result); });
// Output: [ "3" ]
```

</details>

<details>
<summary> jsonParse(jsonString)</summary>

Parses a JSON string into an object.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const expression = trutoJsonata("$jsonParse('{\"name\":\"Alice\"}')");
expression.evaluate({}).then(result => { console.log(result); });
// Output: { name: 'Alice' }
```

</details>

<details>
<summary> getMimeType(fileName)</summary>

Returns the MIME type based on the file extension.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const expression = trutoJsonata("$getMimeType('html')");
expression.evaluate({}).then(result => { console.log(result); });
// Output: 'text/html'
```

</details>

<details>
<summary>uuid()</summary>

Generates a new UUID (version 4).

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const expression = trutoJsonata("$uuid()");
expression.evaluate({ }).then(result => { console.log(result); });
// Output: A UUID string
```

</details>

<details>
<summary>getArrayBuffer(file)</summary>

Converts a `Blob` file to an `ArrayBuffer`. If no file is provided, the function returns `undefined`.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const file = new Blob(['Hello, World!'], { type: 'text/plain' });
const expression = trutoJsonata("$getArrayBuffer(file)");
expression.evaluate({ file}).then(result => { console.log(result); });
// Output: ArrayBuffer(13) [ 72, 101, 108, 108, 111, 44, 32, 87, 111, 114, 108, 100, 33 ]
```

</details>

<details>
<summary>getDataUri(file)</summary>

Converts a `Blob` or `Buffer` or `Readable Stream` to a data URI.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';
const file = new Blob(['Hello, World!'], { type: 'text/plain' });
const expression = trutoJsonata("getDataUri(file)");
expression.evaluate({ file}).then(result => { console.log(result); });
// Output: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
```

</details>

<details>
<summary>blob(content, options)</summary>

Creates a `Blob` object from content with the specified MIME type.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const content = ['Hello, World!'];
const options = { type: 'text/plain' };
const expression = trutoJsonata("$blob(content, options)");
console.log(expression.evaluate({ content, options }));
/* Output: 
Blob (13 bytes) {
  type: "text/plain;charset=utf-8"
}
*/
```

</details>

<details>
<summary>digest(text, algorithm = 'SHA-256', stringType = 'hex')</summary>

Generates a cryptographic hash of the input text using a specified hashing algorithm and output format.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

// Example 1: Default Usage (SHA-256, Hex Output)
const text1 = 'Hello, World!';
const algorithm1 = 'SHA-256';
const stringType1 = 'hex';

const expression1 = trutoJsonata("$digest(text, algorithm, stringType)");
expression1.evaluate({ text: text1, algorithm: algorithm1, stringType: stringType1 }).then(result => {
  console.log(result);
  // Output: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b53ee6b9c6fbc9c39"
});

// Example 2: SHA-512 Algorithm, Hex Output
const text2 = 'The quick brown fox jumps over the lazy dog';
const algorithm2 = 'SHA-512';
const stringType2 = 'hex';

const expression2 = trutoJsonata("$digest(text, algorithm, stringType)");
expression2.evaluate({ text: text2, algorithm: algorithm2, stringType: stringType2 }).then(result => {
  console.log(result);
  // Output: "07e547d9586f6a73f73fbac0435ed76951218fb7d0c8d788a309d785436bbb64..."
});

// Example 3: SHA-256 Algorithm, Base64 Output
const text3 = 'Data security is key';
const algorithm3 = 'SHA-256';
const stringType3 = 'base64';

const expression3 = trutoJsonata("$digest(text, algorithm, stringType)");
expression3.evaluate({ text: text3, algorithm: algorithm3, stringType: stringType3 }).then(result => {
  console.log(result);
  // Output: "Xh3mV+fAAG7ScGPjo4PElmR3obnFzGrxnbwGpEE4lI4="

});

```

</details>

<details>
<summary>sign(text, algorithm = 'SHA-256', secret, outputFormat = 'hex')</summary>

Generates a cryptographic HMAC signature of the input text using a specified hash algorithm and secret key.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

// Example 1: Default Configuration (SHA-256, Hex Output)
const text1 = 'Hello, World!';
const algorithm1 = 'SHA-256';
const secret1 = 'mySecretKey';
const outputFormat1 = 'hex';

const expression1 = trutoJsonata("$sign(text, algorithm, secret, outputFormat)");
expression1.evaluate({ text: text1, algorithm: algorithm1, secret: secret1, outputFormat: outputFormat1 }).then(result => {
  console.log(result);
  // Output: "7a60d197fc6a4e91ab6f09f17d74e5a62d3a57ef6c4dc028ef2b8f38a328d2b9"
});

// Example 2: SHA-512 Algorithm, Hex Output
const text2 = 'The quick brown fox jumps over the lazy dog';
const algorithm2 = 'SHA-512';
const secret2 = 'anotherSecretKey';
const outputFormat2 = 'hex';

const expression2 = trutoJsonata("$sign(text, algorithm, secret, outputFormat)");
expression2.evaluate({ text: text2, algorithm: algorithm2, secret: secret2, outputFormat: outputFormat2 }).then(result => {
  console.log(result);  
  /*
  Output:"b9b229b20c8c1088f0d89e2324a8c8cc8e5fd1ec80d1783b00320df3e7a9b660f2d86b2f06089ee1a6b5ef35ee0d4d38de836fe4b46e4f35c9eea66c92ab3c0f"
  */
});
```

</details>

<details>
<summary>signJwt(payload, secretOrPrivateKey, options)</summary>

Generates a signed JWT using the JOSE library. Supports various algorithms via options.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const payload = { sub: '1234567890', name: 'John Doe' };
const secretOrPrivateKey = 'your-256-bit-secret';
const options = { expiresIn: '1h', algorithm: 'HS256' };

const expression = trutoJsonata('$signJwt(payload, secretOrPrivateKey, options)');
expression.evaluate({ payload, secretOrPrivateKey, options }).then(result => {
  // Output: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.<signature>"
});
```

</details>

<details>
<summary>xmlToJs(xml, options = { compact: true, spaces: 4 } )</summary>

Converts an XML string into a JavaScript object.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

// Example 1: Default Configuration (Compact Format, Indentation = 4 Spaces)
const xmlData1 = `
  <note>
    <to>User</to>
    <message>Hello, World!</message>
  </note>
`;
const expression1 = trutoJsonata("$xmlToJs(xmlData)");
expression1.evaluate({ xmlData: xmlData1 }).then(result => {
  console.log(result);
  /*
  Output:
  {
    note: {
      to: {
        _text: "User"
      },
      message: {
        _text: "Hello, World!"
      }
    }
  }
  */
});

// Example 2: Non-Compact Format with no spaces specified
const xmlData2 = `
  <library>
    <book>
      <title>1984</title>
      <author>George Orwell</author>
    </book>
    <book>
      <title>Brave New World</title>
      <author>Aldous Huxley</author>
    </book>
  </library>
`;

const options2 = { compact: false };
const expression2 = trutoJsonata("$xmlToJs(xmlData, options)");
expression2.evaluate({ xmlData: xmlData2, options: options2 }).then(result => {
  console.log(result);
  /*
  Output:
  {
    elements: [
      {
        type: "element",
        name: "library",
        elements: [
          {
            type: "element",
            name: "book",
            elements: [
              { type: "element", name: "title", elements: [{ type: "text", text: "1984" }] },
              { type: "element", name: "author", elements: [{ type: "text", text: "George Orwell" }] }
            ]
          },
          {
            type: "element",
            name: "book",
            elements: [
              { type: "element", name: "title", elements: [{ type: "text", text: "Brave New World" }] },
              { type: "element", name: "author", elements: [{ type: "text", text: "Aldous Huxley" }] }
            ]
          }
        ]
      }
    ]
  }
  */
});

// Example 3: Compact Format with Custom Indentation (spaces = 2)
const xmlData3 = `
  <users>
    <user>
      <name>Alice</name>
      <age>30</age>
    </user>
    <user>
      <name>Bob</name>
      <age>25</age>
    </user>
  </users>
`;

const options3 = { compact: true, spaces: 2 };
const expression3 = trutoJsonata("$xmlToJs(xmlData, options)");
expression3.evaluate({ xmlData: xmlData3, options: options3 }).then(result => {
  console.log(result);
  /*
  Output:
  {
    users: {
      user: [
        {
          name: {
            _text: "Alice"
          },
          age: {
            _text: "30"
          }
        },
        {
          name: {
            _text: "Bob"
          },
          age: {
            _text: "25"
          }
        }
      ]
    }
  }
  */
});
```

</details>

<details>
<summary>jsToXml(json, options = { compact: true, spaces: 4 } )</summary>

Converts a JavaScript object into an XML string.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

// Example 1: Default Configuration (Compact Format, Indentation = 4 Spaces)
const jsonData1 = {
  note: {
    to: { _text: "User" },
    message: { _text: "Hello, World!" }
  }
};

const expression1 = trutoJsonata("$jsToXml(jsonData)");
expression1.evaluate({ jsonData: jsonData1 }).then(result => {
  console.log(result);
  /*
  Output:
  <note>
      <to>User</to>
      <message>Hello, World!</message>
  </note>
  */
});

// Example 2: Non-Compact with no spaces specified
const jsonData2 = {
  elements: [
    {
      type: "element",
      name: "library",
      elements: [
        {
          type: "element",
          name: "book",
          elements: [
            { type: "element", name: "title", elements: [{ type: "text", text: "1984" }] },
            { type: "element", name: "author", elements: [{ type: "text", text: "George Orwell" }] }
          ]
        },
        {
          type: "element",
          name: "book",
          elements: [
            { type: "element", name: "title", elements: [{ type: "text", text: "Brave New World" }] },
            { type: "element", name: "author", elements: [{ type: "text", text: "Aldous Huxley" }] }
          ]
        }
      ]
    }
  ]
};

const options2 = { compact: false };
const expression2 = trutoJsonata("$jsToXml(jsonData, options)");
expression2.evaluate({ jsonData: jsonData2, options: options2 }).then(result => {
  console.log(result);
  /*
  Output:
  <library><book><title>1984</title><author>George Orwell</author></book><book><title>Brave New World</title><author>Aldous Huxley</author></book></library>
  */
});

// Example 3: Non-Compact with Custom Indentation (4 Spaces)
const jsonData3 = {
  elements: [
    {
      type: "element",
      name: "catalog",
      elements: [
        {
          type: "element",
          name: "product",
          elements: [
            { type: "element", name: "name", elements: [{ type: "text", text: "Laptop" }] },
            { type: "element", name: "price", elements: [{ type: "text", text: "$1200" }] }
          ]
        },
        {
          type: "element",
          name: "product",
          elements: [
            { type: "element", name: "name", elements: [{ type: "text", text: "Smartphone" }] },
            { type: "element", name: "price", elements: [{ type: "text", text: "$800" }] }
          ]
        }
      ]
    }
  ]
};

const options3 = { compact: false, spaces: 4 };
const expression3 = trutoJsonata("$jsToXml(jsonData, options)");
expression3.evaluate({ jsonData: jsonData3, options: options3 }).then(result => {
  console.log(result);
  /*
  Output:
  <catalog>
      <product>
          <name>Laptop</name>
          <price>$1200</price>
      </product>
      <product>
          <name>Smartphone</name>
          <price>$800</price>
      </product>
  </catalog>
  */
});
```

</details>

<details>
<summary>parseDocument(file)</summary>

Parses a document file (e.g., PDF, DOCX) and extracts text content.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';
const file = new Blob(['Hello, World!'], { type: 'application/pdf' });
const buffer = await file.arrayBuffer();
const expression = trutoJsonata("$parseDocument(buffer)");
expression.evaluate({ file}).then(result => { console.log(result); });
// Output: 'Hello, World!'

````

</details>

### Markdown and Text Conversion

<details>
<summary>convertMarkdownToGoogleDocs(text)</summary>

Converts Markdown text into a Google Docs API-compatible request format for applying text styles and content. For more details on the Google Docs API request format, refer to the [Google Docs API documentation](https://developers.google.com/docs/api/reference/rest/v1/documents/request).

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const markdownText = `
# Hello, World!
This is a *bold* statement.
`;

// Use convertMarkdownToGoogleDocs to convert Markdown to Google Docs format
const expression = trutoJsonata("$convertMarkdownToGoogleDocs(markdownText)");
expression.evaluate({ markdownText}).then(result => { console.log(result); });

//Output :
/*
{
  requests: [
    {
      insertText: [Object ...],
    }, {
      insertText: [Object ...],
    }, {
      insertText: [Object ...],
    }, {
      insertText: [Object ...],
    }, {
      insertText: [Object ...],
    }, {
      insertText: [Object ...],
    }, {
      updateParagraphStyle: [Object ...],
    }, {
      updateTextStyle: [Object ...],
    }
  ],
}
*/
```

</details>

<details>
<summary>convertMarkdownToNotion(markdown)</summary>

Converts Markdown text into a format compatible with Notion. For more details on the Notion API block format, refer to the [Notion Blocks Documentation](https://developers.notion.com/reference/block).

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

// Define Markdown text to convert
const markdownText = `
# Hello, Notion!
This is some **bold** text.
`;

// Use convertMarkdownToNotion to transform Markdown into Notion block format
const expression = trutoJsonata("$convertMarkdownToNotion(markdownText)");
expression.evaluate({ markdownText}).then(result => { console.log(result); });
/*
Output:
{
  children: [
    {
      type: "paragraph",
      paragraph: [Object ...],
    }, {
      type: "heading_1",
      heading_1: [Object ...],
    }, {
      type: "paragraph",
      paragraph: [Object ...],
    }
  ],
}
*/
```

</details>

<details>
<summary>convertMarkdownToSlack(markdown)</summary>

Converts Markdown text into a format compatible with Slack messages.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

// Define Markdown text to convert
const markdownText = `
# Hello, Slack!
This is a message with *italic* and **bold** text.
`;

// Use convertMarkdownToSlack to transform Markdown into Slack format
const expression = trutoJsonata("$convertMarkdownToSlack(markdownText)");
expression.evaluate({ markdownText}).then(result => { console.log(result); });

/*
Output:
[
  {
    type: "section",
    text: {
      type: "mrkdwn",
      text: "\n",
    },
  }, {
    type: "header",
    text: {
      type: "plain_text",
      text: "Hello, Slack!",
      emoji: true,
    },
  }, {
    type: "section",
    text: {
      type: "mrkdwn",
      text: "This is a message with *italic* and *bold* text.",
    },
  }
]
*/
```

</details>

<details>
<summary>convertNotionToMarkdown(blocks)</summary>

Transforms a list of Notion blocks into a Markdown-formatted string, preserving content structure, lists, and hierarchical relationships.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

// Define Notion blocks structure to convert
const notionBlocks = [
  { type: 'heading_1', text: { content: 'Introduction' } },
  { type: 'paragraph', text: { content: 'This is a paragraph.' } },
  {
    type: 'bulleted_list_item',
    text: { content: 'List item 1' },
    children: [
      { type: 'bulleted_list_item', text: { content: 'Nested item 1' } }
    ]
  },
  { type: 'bulleted_list_item', text: { content: 'List item 2' } }
];
const expression = trutoJsonata("$convertNotionToMarkdown(notionBlocks)");
expression.evaluate({ notionBlocks}).then(result => { console.log(result); });

/*
Output:
# Introduction

This is a paragraph.

- List item 1
  - Nested item 1
- List item 2
*/
```

</details>

<details>
<summary>convertHtmlToMarkdown(htmlString)</summary>

Converts HTML content to Markdown format.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

// Define an HTML string to convert
const htmlContent = `
  <h1>Welcome to Markdown</h1>
  <p>This is a <strong>bold</strong> statement.</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
`;

// Use convertHtmlToMarkdown to transform HTML into Markdown
const expression = trutoJsonata("$convertHtmlToMarkdown(htmlContent)");
expression.evaluate({ htmlContent }).then(result => { console.log(result); });

/*
Output:

Welcome to Markdown
===================

This is a **bold** statement.

*   Item 1
*   Item 2

*/
```

</details>

<details>
<summary>convertMarkdownToHtml(markdownString)</summary>

Converts Markdown content to HTML format.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

// Define an Markdown string to convert
const markdownContent = `
  # Welcome to Markdown
  This is a **bold** statement.
  - Item 1
  - Item 2
`;

// Use convertMarkdownToHtml to transform Markdown into HTML
const expression = trutoJsonata("$convertMarkdownToHtml(markdownContent)");
expression.evaluate({ markdownContent }).then(result => { console.log(result); });

/*
Output:

<h1>Welcome to Markdown</h1>
<p>This is a <strong>bold</strong> statement.</p>
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
</ul>

*/
```

</details>

---  

### Array and Object Utilities (Lodash Enhancements)

These functions are inspired by [Lodash](https://lodash.com/) and adapted for use within JSONata expressions.

<details>
<summary>difference(array1, array2)</summary>

Returns an array of elements from `array1` not in `array2`

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const dataArray = [1, 2, 3]
const differentArray = [2, 3]
const expression = trutoJsonata("$difference(dataArray,differentArray)");
expression.evaluate({}).then(result => { console.log(result); });
// Output: [1]
```

</details>

<details>
<summary>groupBy(array, iteratee)</summary>

Groups the elements of an array based on the given iteratee (key).

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const data = [
  { type: 'fruit', name: 'apple' },
  { type: 'vegetable', name: 'carrot' },
  { type: 'fruit', name: 'banana' }
];
const expression = trutoJsonata("$groupBy(data, 'type')");
expression.evaluate({ data }).then(result => { console.log(result); });
/*
Output:
{
  fruit: [
    {
      type: "fruit",
      name: "apple",
    }, {
      type: "fruit",
      name: "banana",
    }
  ],
  vegetable: [
    {
      type: "vegetable",
      name: "carrot",
    }
  ],
}
*/
```

</details>

<details>
<summary>keyBy(array, iteratee)</summary>

Creates an object composed of keys generated from the results of running each element of `array` through `iteratee`

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const data = [
  { id: 'a', value: 1 },
  { id: 'b', value: 2 }
];
const expression = trutoJsonata("$keyBy(data, 'id')");

expression.evaluate({ data }).then(result => { console.log(result); });
// Output: { a: { id: 'a', value: 1 }, b: { id: 'b', value: 2 } }
```

</details>

<details>
<summary>pick(object, keys)</summary>

Creates an object composed of the selected `keys`

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const data = { name: 'Alice', age: 30, email: 'alice@example.com' };
const expression = trutoJsonata("$pick(data, ['name', 'email'])");
expression.evaluate({ data }).then(result => { console.log(result); });
// Output: { name: 'Alice', email: 'alice@example.com' }
```

</details>

<details>
<summary>omit(object, keys)</summary>

Creates an object without the specified `keys`

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const data = { name: 'Alice', age: 30, email: 'alice@example.com' };
const expression = trutoJsonata("$omit(data, ['age'])");
expression.evaluate({ data }).then(result => { console.log(result); });
// Output: { name: 'Alice', email: 'alice@example.com' }
```

</details>

<details>
<summary>compact(array)</summary>

Creates an array with all falsey values removed.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const data = [0, 1, false, 2, '', 3];
const expression = trutoJsonata("$compact(data)");
expression.evaluate({ data }).then(result => { console.log(result); });
// Output: [1, 2, 3]
```

</details>

<details>
<summary>join(array, separator)</summary>

Joins the elements of an array into a string, separated by `separator`

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const data = ['apple', 'banana', 'cherry'];
const expression = trutoJsonata("$join(data, '; ')");
expression.evaluate({ data }).then(result => { console.log(result); });
// Output: 'apple; banana; cherry'
```

</details>

<details>
<summary>orderBy(collection, iteratees, orders)</summary>

Sorts the collection based on `iteratees` and `orders`

**Example:**

```javascript

import trutoJsonata from '@truto/truto-jsonata';

const data = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 }
];
const expression = trutoJsonata("$orderBy(data, ['age'], ['desc'])");
expression.evaluate({ data }).then(result => { console.log(result); });
/* Output: 
[
  {
    name: "Alice",
    age: 30,
  }, {
    name: "Bob",
    age: 25,
  }
]
*/
```

</details>

<details>
<summary>find(collection, attr)</summary>

Returns a new array containing only the elements that satisfy the attr condition
(i.e. non-falsy values for attr)
**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const data = [
  {active : false},
  {active: "" },
  {active: true },
];
const otherData = [{ name: 'John' }]
const expression = trutoJsonata("$find(data, 'active')");
const otherExpression =  trutoJsonata("$find(otherData, 'name')");
expression.evaluate({ data }).then(result => { console.log(result); });
otherExpression.evaluate({ otherData }).then(result => { console.log(result); });
/* Output: 
{
  active: true,
}
{
  name: "John",
}
*/
```

</details>

<details>
<summary>lofilter(collection, predicate)</summary>

Filters the collection based on the `predicate`

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const data = [
  {active : false},
  {active: "" },
  {active: true },
];
const otherData = [{ name: 'John' }]
const expression = trutoJsonata("$lofilter(data, 'active')");
const otherExpression =  trutoJsonata("$lofilter(otherData, 'name')");
expression.evaluate({ data }).then(result => { console.log(result); });
otherExpression.evaluate({ otherData }).then(result => { console.log(result); });
/*
Output:
[
  {
    active: true,
  }
]
[
  {
    name: "John",
  }
]
*/
```

</details>

<details>
<summary>values(object)</summary>

Returns an array of the object's own enumerable property values.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const data = { a: 1, b: 2, c: 3 };
const expression = trutoJsonata("$values(data)");
expression.evaluate({ data }).then(result => { console.log(result); });
// Output: [1, 2, 3]
```

</details>

<details>
<summary>flatten(array)</summary>

Flattens an array a single level deep.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const expression = trutoJsonata("$flatten([1, [2, [3]]])");
expression.evaluate({}).then(result => { console.log(result); });
// Output: [1, 2, [3]]
```

</details>

<details>
<summary>flattenDeep(array)</summary>

Recursively flattens an array, flattening all nested arrays into a single array.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const expression = trutoJsonata("$flattenDeep([1, [2, [3, [4, [5]]]])");
expression.evaluate({}).then(result => { console.log(result); });
// Output: [1, 2, 3, 4, 5]
```

</details>

<details>
<summary>flattenDepth(array, depth)</summary>

Flattens an array up to the specified depth.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const expression = trutoJsonata("$flattenDepth([1, [2, [3, [4, [5]]]]], 2)");
expression.evaluate({}).then(result => { console.log(result); });
// Output: [1, 2, 3, [4, [5]]]
```

</details>


---
  
### Parsing and URL Functions

<details>
<summary>parseUrl(urlString)</summary>

Parses a URL string and returns a [URL object](https://developer.mozilla.org/en-US/docs/Web/API/URL/URL)

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const data = 'https://example.com/path?query=123#hash';
const expression = trutoJsonata("$parseUrl(data)");
expression.evaluate({ data }).then(result => { console.log(result); });
/*
Output:
URL {
  href: "https://example.com/path?query=123#hash",
  origin: "https://example.com",
  protocol: "https:",
  username: "",
  password: "",
  host: "example.com",
  hostname: "example.com",
  port: "",
  pathname: "/path",
  hash: "#hash",
  search: "?query=123",
  searchParams: URLSearchParams {
    "query": "123",
  },
  toJSON: [Function: toJSON],
  toString: [Function: toString],
}
*/
```

</details>

---

### AI Stuff

<details>
<summary>generateEmbeddingsCohere(body, api_key)</summary>

Generate embeddings through Cohere /embed API.

**Parameters:**

- **body**: The object similar to what [Cohere's /embed API](https://docs.cohere.com/reference/embed) expects.
- **api_key**: Cohere's API Key

**Example Usage:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const body = {
  "model": "embed-multilingual-v3.0",
  "texts": [
    "hello",
    "goodbye"
  ],
  "input_type": "classification",
  "embedding_types": [
    "float"
  ]
};
const api_key = "c7fdd028-d967-456a-9765-be47a7959f7e";
const expression = trutoJsonata("$generateEmbeddingsCohere(body, api_key)");
expression.evaluate({ body, api_key }).then(result => { console.log(result); });
// Output: {"id": "c7fdd028-d967-456a-9765-be47a7959f7e", .....}
```

</details>

<details>
<summary>recursiveCharacterTextSplitter(text, options)</summary>

Splits a text into an array of characters, words, or sentences, recursively.

**Parameters:**

- **text**: The input text to split.
- **options**: An object containing the following properties:
  - **chunkSize**: The maximum number of characters, words, or sentences per chunk (default is `200`).
  - **chunkOverlap**: The number of characters, words, or sentences to overlap between chunks (default is `60`).

**Example Usage:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const text = "Hello, World! This is a sample text.";
const options = {
    chunkSize: 10,
    chunkOverlap: 3
};
const expression = trutoJsonata("$recursiveCharacterTextSplitter(text, options)");
expression.evaluate(text).then(result => { console.log(result); });
// Output: ["Hello, Wo", "lo, World", "rld! This", "is a samp", "ample text", "text."]
```

</details>


### Miscellaneous

<details>
<summary>mostSimilar(value, possibleValues, threshold = 0.8)</summary>

Finds the most similar string from a list of possible values based on the Dice Coefficient similarity score. If the similarity exceeds the threshold, the closest match is returned.

**Parameters:**

- **value**: The input string for which to find a similar match.
- **possibleValues**: An array of strings to compare against the input.
- **threshold**: A minimum similarity score (default is `0.8`), above which the closest match is returned.

**Example Usage:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

// Define input and possible values
const input = 'appl';
const possibleValues = ['apple', 'apricot', 'banana'];
const threshold = 0.8;
// Use mostSimilar to find the closest match
const expression = trutoJsonata("$mostSimilar(input, possibleValues, threshold)");
expression.evaluate({ input, possibleValues, threshold }).then(result => { console.log(result); });
// Output: 'apple' (since 'apple' is the most similar to 'appl' and exceeds the similarity threshold)
```

</details>

<details>
<summary>sortNodes(array,   idKey = 'id',
  parentIdKey = 'parent_id',
  sequenceKey = 'sequence')</summary>

Sorts a flat list of nodes into a hierarchical, parent-child structure based on `parent_id`, then sorts nodes by a specified sequence key, and finally flattens the sorted structure.

**Parameters:**

- **array**: An array of node objects to be sorted.
- **idKey**: The key for the node's unique identifier (default is `"id"`).
- **parentIdKey**: The key for the node's parent identifier (default is `"parent_id"`).
- **sequenceKey**: The key used to sort nodes within each hierarchy level (default is `"sequence"`).

**Node Structure:**

Each node should follow this format:

```typescript
{
  id: string | number,
  parent_id?: string | number | null,
  sequence: number,
}
```

**Example Usage:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

// Example 1: Basic Parent-Child Structure with Root Nodes
const nodes1 = [
  { id: 1, sequence: 1 },
  { id: 2, parent_id: 1, sequence: 2 },
  { id: 3, sequence: 3 },
  { id: 4, parent_id: 1, sequence: 1 }
];
const expression1 = trutoJsonata("$sortNodes(nodes)");
expression1.evaluate({ nodes: nodes1 }).then(result => {
  console.log(result);
  /*
  Output:
  [
    { id: 1, sequence: 1 },
    { id: 4, parent_id: 1, sequence: 1 },
    { id: 2, parent_id: 1, sequence: 2 },
    { id: 3, sequence: 3 }
  ]
  */
});

// Example 2: Multiple Root Nodes with Nested Children, Custom Sequence
const nodes2 = [
    { uniqueId: 1, seqNumber: 2 },
    { uniqueId: 2, parentUniqueId: 1, seqNumber: 1 },
    { uniqueId: 3, seqNumber: 1 },
    { uniqueId: 4, parentUniqueId: 3, seqNumber: 2 },
    { uniqueId: 5, parentUniqueId: 3, seqNumber: 1 }
  ];
const options2 = { idKey: 'uniqueId', parentIdKey: 'parentUniqueId', sequenceKey: 'seqNumber' };
const expression2 = trutoJsonata("$sortNodes(nodes, idKey, parentIdKey, sequenceKey)");
expression2.evaluate({ nodes: nodes2, ...options2 }).then(result => {
  console.log(result);
    /*
    Output:
    [
      { uniqueId: 3, seqNumber: 1 },
      { uniqueId: 5, parentUniqueId: 3, seqNumber: 1 },
      { uniqueId: 4, parentUniqueId: 3, seqNumber: 2 },
      { uniqueId: 1, seqNumber: 2 },
      { uniqueId: 2, parentUniqueId: 1, seqNumber: 1 }
    ]
    */
  });
```

</details>

<details>
<summary>wrap(value, wrapper, endWrapper)</summary>

Wraps `value` with `wrapper` and `endWrapper` (if provided). If `endWrapper` is not provided, `wrapper` is used for both ends.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const expression = trutoJsonata("$wrap('content', '<div>', '</div>')");
expression.evaluate({}).then(result => { console.log(result); });
// Output: '<div>content</div>'
```

</details>

<details>
<summary>base64encode(input, urlSafe = false)</summary>

Encodes the input data in Base64.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const expression = trutoJsonata("$base64encode('Hello, World!')");
expression.evaluate({}).then(result => { console.log(result); });
// Output: 'SGVsbG8sIFdvcmxkIQ=='
```

</details>

<details>
<summary>base64decode(base64String, urlSafe = false)</summary>

Decodes a Base64-encoded string.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const expression = trutoJsonata("$base64decode('SGVsbG8sIFdvcmxkIQ==')");
expression.evaluate({}).then(result => { console.log(result); });
// Output: 'Hello, World!'
```

</details>

<details>
<summary>base64ToBlob(base64String, options = {})</summary>

Converts a Base64-encoded string to a Blob object.

**Parameters:**

- **base64String**: The Base64 string to convert. Can include data URI prefixes (e.g., `data:image/png;base64,iVBORw0...`)
- **options** _(Optional)_: An object containing:
  - **mimeType**: The MIME type for the resulting Blob (default: `'application/octet-stream'`)
  - **urlSafe**: Whether to handle URL-safe Base64 encoding (default: `false`)

**Features:**

- Handles data URI format automatically
- Supports URL-safe Base64 encoding
- Automatic padding correction
- Comprehensive error handling for invalid Base64 strings
- MIME type detection from data URI or custom specification

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

// Basic usage
const expression1 = trutoJsonata("$base64ToBlob('SGVsbG8gd29ybGQ=', { mimeType: 'text/plain' })");
expression1.evaluate({}).then(result => { 
  console.log(result); 
  // Output: Blob object with type 'text/plain' and size 11
});

// Data URI format
const expression2 = trutoJsonata("$base64ToBlob('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==')");
expression2.evaluate({}).then(result => { 
  console.log(result); 
  // Output: Blob object with type 'image/png' (auto-detected from data URI)
});

// URL-safe Base64
const expression3 = trutoJsonata("$base64ToBlob('aHR0cHM6Ly9leGFtcGxlLmNvbS8_cXVlcnk9YmFzZTY0', { urlSafe: true })");
expression3.evaluate({}).then(result => { 
  console.log(result); 
  // Output: Blob object containing the decoded data
});
```

</details>



<details>
<summary>chunk(arr,size)</summary>

Chunks an array into smaller arrays of a specified size.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';


const expression = trutoJsonata("$chunk([1, 2, 3, 4, 5], 2)");
expression.evaluate({}).then(result => { console.log(result); });
// Output: [[1,2],[3,4],[5]]
```

</details>