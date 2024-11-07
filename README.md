
  

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

  

-  **Enhanced JSONata Expressions**: Adds custom functions to JSONata expressions for advanced data manipulation.

-  **Data Transformation**: Functions for date parsing, currency conversion, and object manipulation.

-  **Text Conversion**: Convert between Markdown, HTML, Notion, Slack, and Google Docs formats.

-  **Cryptographic Operations**: Generate digests and signatures.

-  **Utility Functions**: Lodash-inspired array and object utilities.

-  **Parsing Utilities**: URL parsing and JSON parsing functions.

-  **Miscellaneous**: Functions for similarity checks, node sorting, and more.

  

## Requirements

  

-  **Node.js**: Version 22 or higher.

-  **TypeScript**: (Optional) If you're using TypeScript in your project.

  

## Installation

  

Install the package using npm:

  

```bash
npm  i  @truto/truto-jsonata
```

Or with yarn:

  

```bash
yarn  add  @truto/truto-jsonata
```

  

## Usage

  

To use `truto-jsonata`, import the default function and pass your JSONata expression as a string. This function returns an `Expression` object with all custom functions registered.

  

```javascript

import  trutoJsonata  from  '@truto/truto-jsonata';
const  expressionString = 'your JSONata expression here';
const  expression = trutoJsonata(expressionString);

// Evaluate the expression with your data

const  data = { /* your data object */ };
const  result = expression.evaluate(data);
console.log(result);

```


Alternatively, if you already have a JSONata expression and want to register the custom functions:


```javascript

import  jsonata  from  'jsonata';
import  registerJsonataExtensions  from  '@truto/truto-jsonata/registerJsonataExtensions';
const  expression = jsonata('your expression');

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
<summary> convertQueryToSql(queryObject)</summary>

Converts a query object into an SQL query string.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';


const data = {
  name: { eq: 'John' },
  age: { gte: '30' },
  city: { in: ['New York', 'Los Angeles'] },

};
const expression = trutoJsonata("$convertQueryToSql(data)");
expression.evaluate({data}).then(result => { console.log(result); });

// Output: name = John AND age >= 30 AND city in (New York,Los Angeles)
```
</details>

<details>
<summary> mapValues(object, iteratee)</summary>

Transforms an object, array, string, or number based on a provided mapping. The function applies mappings recursively and can handle case insensitivity or default values if the mapping doesn’t exist.

**Example:**

```javascript

import trutoJsonata from '@truto/truto-jsonata';

const roleKey = "1";
const roleMapping = {
  "1": "owner",
  "2": "admin",
  "3": "member",
  "4": "guest"
};

const roleExpression = trutoJsonata("$mapValues(roleKey, roleMapping, true, 'Unknown')");
roleExpression.evaluate({ roleKey, roleMapping }).then(result => {
  console.log(result);
});

//Output: owner

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

Returns the first argument that is not empty.

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
<summary>digest(text, algorithm, stringType)</summary>

Generates a cryptographic hash of the input text using a specified hashing algorithm and output format.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';
const text = 'Hello, World!';
const algorithm = 'SHA-256';
const stringType = 'hex';
const expression = trutoJsonata("$digest(text, algorithm, stringType)");
expression.evaluate({ text, algorithm, stringType }).then(result => { console.log(result); });
// Output: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b53a30b4e527b9fd4" 
```
</details>



<details>
<summary>sign(text, algorithm, secret, outputFormat)</summary>

Generates a cryptographic HMAC signature of the input text using a specified hash algorithm and secret key.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';
const text = 'Hello, World!';
const algorithm = 'SHA-256';
const secret = 'mySecretKey';
const outputFormat = 'hex';
const expression = trutoJsonata("$sign(text, algorithm, secret, outputFormat)");
expression.evaluate({ text, algorithm, secret, outputFormat }).then(result => {
  console.log(result)
  // Output: "7a60d197fc6a4e91ab6f09f17d74e5a62d3a57ef6c4dc028ef2b8f38a328d2b9" 
});
```
</details> 


<details>
<summary>xmlToJs(xml, options)</summary>

Converts an XML string into a JavaScript object.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

const xmlData = `
  <note>
    <to>User</to>
    <message>Hello, World!</message>
  </note>
`;
const expression = trutoJsonata("$xmlToJs(xmlData)");
expression.evaluate({ xmlData }).then(result => { console.log(result); });
/*
Output:
{
  note: {
    to: {
      _text: "User",
    },
    message: {
      _text: "Hello, World!",
    },
  },
}
*/
```
</details>

<details>
<summary>jsToXml(json, options)</summary>

Converts a JavaScript object into an XML string.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';
const jsonData = {
  note: {
    to: { _text: "User" },
    message: { _text: "Hello, World!" }
  }
};
const expression = trutoJsonata("$jsToXml(jsonData)");
expression.evaluate({ jsonData}).then(result => { console.log(result); });
/*
Output:
<note>
    <to>User</to>
    <message>Hello, World!</message>
</note>
*/
```
</details>

  

### Markdown and Text Conversion

<details>
<summary>convertMarkdownToGoogleDocs(text, currentCounter)</summary>

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
<summary>join(array, separator=',')</summary>

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

### Miscellaneous

<details>
<summary>mostSimilar(value, possibleValues, threshold)</summary>

Finds the most similar string from a list of possible values based on the Dice Coefficient similarity score. If the similarity exceeds the threshold, the closest match is returned.

**Parameters:**

- **value**: The input string for which to find a similar match.
- **possibleValues**: An array of strings to compare against the input.
- **threshold**: A minimum similarity score (default is `0.8`), above which the closest match is returned.

**Example Usage:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

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
<summary>sortNodes(array, idKey, parentIdKey, sequenceKey)</summary>

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
  children?: Node[] // Optional, used internally
}
```

**Example Usage:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';

// Define an array of nodes to be sorted
const nodes = [
  { id: 1, sequence: 1 },
  { id: 2, parent_id: 1, sequence: 1 },
  { id: 3, parent_id: 1, sequence: 2 },
  { id: 4, sequence: 2 },
  { id: 5, parent_id: 2, sequence: 1 }
];

// Use sortNodes to create and flatten the hierarchical structure
const expression = trutoJsonata("$sortNodes(nodes)");
expression.evaluate({ nodes }).then(result => { console.log(result); });
/*
Output:
[
  { id: 1, sequence: 1 },
  { id: 2, parent_id: 1, sequence: 1 },
  { id: 5, parent_id: 2, sequence: 1 },
  { id: 3, parent_id: 1, sequence: 2 },
  { id: 4, sequence: 2 }
]
*/
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
<summary>base64encode(input)</summary>

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
<summary>base64decode(base64String)</summary>

Decodes a Base64-encoded string.

**Example:**

```javascript
import trutoJsonata from '@truto/truto-jsonata';
const expression = trutoJsonata("$base64decode('SGVsbG8sIFdvcmxkIQ==')");

expression.evaluate({}).then(result => { console.log(result); });

// Output: 'Hello, World!'
```
</details>


  

