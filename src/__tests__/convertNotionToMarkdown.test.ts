import { describe, expect, it } from 'vitest'
import convertNotionToMarkdown from '../functions/convertNotionToMarkdown'
import { notionBlocks } from './notionBlocks'

describe('convertNotionToMarkdown', async () => {
  it('test', async () => {
    expect(convertNotionToMarkdown(notionBlocks)).toEqual(`# heading 1

## heading 2

### heading 3

A paragraph

A para with _underline_ _italics_ **bold** ~~strikethrough~~

A para with [link](https://google.com/)

A para with \`code snippet\`

- [ ] Todo 1
- [ ] Todo 2
- [X] Todo 3
\t- [ ] Todo 3.1
\t\t- [ ] Todo 3.1.1
\t- [ ] Todo 3.2
\t\t- [ ] Todo 3.2.1


| Row 1 **Col 1** | Row 1 [Col 2](http://test.com/) |
|---|---|
| Row 2 Col 1 | Row 2 Col 2 |
| Row 3 Col 1 | Row 3 Col 2 |

| Header 1 | Header 2 |
|---|---|
| Row 1 Col 1 | Row 1 Col 2 |
| Row 2 Col 1 | Row 2 Col 2 |

- Bullet 1
- Bullet 2 with **bold**
\t- Bullet 2.1
- Bullet 3
1. Numbered list 1
\t1. Numbered list 1.1
2. Numbered list 2
\t1. Numbered list 2.1
3. Numbered [list 3](https://youtube.com/)


Toggle

Toggle content, with with _underline_ _italics_ **bold** ~~strikethrough~~

> A quote with **bold**

---

![Image](https://prod-files-secure.s3.us-west-2.amazonaws.com/06be9f0f-88d6-406f-b1fb-2702a1f6841b/b72b27af-85ad-4f07-8ab3-5f3da823dd66/rapidbridge-how-it-works.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45HZZMZUHI%2F20241008%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20241008T130230Z&X-Amz-Expires=3600&X-Amz-Signature=edd024437826127a612c232ee4329f5cd7a7c0211ec21231e3b0850e129ce914&X-Amz-SignedHeaders=host&x-id=GetObject)

\`\`\`javascript
const test = "foo bar"
for (i=0;i<10;i++) {
\tconsole.log("test")
}

//comment
\`\`\`

A file embed

[File](https://prod-files-secure.s3.us-west-2.amazonaws.com/06be9f0f-88d6-406f-b1fb-2702a1f6841b/89650710-b596-441e-b584-de20565151b1/truto_icon_logo800.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45HZZMZUHI%2F20241008%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20241008T130230Z&X-Amz-Expires=3600&X-Amz-Signature=e50067f0ac2c0311ead99ac5a687c73d3757de72063643d856e104870fa102fb&X-Amz-SignedHeaders=host&x-id=GetObject)



`)
  })
})
