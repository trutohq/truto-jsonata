export const DATETIME_SCAN_FIXTURE: Record<string, unknown> = {
  date_created: '2024-01-15T12:00:00.000Z',
  date_updated: '2024-01-15T12:00:00.000Z',
  created_at: '2024-01-15T12:00:00.000Z',
  updated_at: '2024-01-15T12:00:00.000Z',
  createdon: '2024-01-15T12:00:00.000Z',
  modifiedon: '2024-01-15T12:00:00.000Z',
  lastlogindate: '2024-01-15T12:00:00.000Z',
  sys_created_on: '2024-01-15 12:00:00',
  sys_updated_on: '2024-01-15 12:00:00',
  datecreated: '01/15/2024',
  lastmodifieddate: '01/15/2024',
  start_date: '2024-01-15',
  end_date: '2024-01-31',
  startDate: '2024-01-15',
  due_date: '2024-01-15T12:00:00.000Z',
  dueDate: '2024-01-15',
  closed_at: '2024-01-15 12:00:00',
  query: {
    created_at: {
      gt: '2024-01-15T00:00:00.000Z',
      gte: '2024-01-15T00:00:00.000Z',
      lt: '2024-01-15T23:59:59.000Z',
      lte: '2024-01-15T23:59:59.000Z',
    },
    start_date: '2024-01-15',
    end_date: '2024-01-31',
    completed_at: '2024-01-15T12:00:00.000Z',
    updated_at: '2024-01-15T12:00:00.000Z',
    file_url: 'https://cdn.example.com/f.pdf?mime_type=application%2Fpdf',
  },
  rawQuery: {
    created_at: { gt: '2024-01-15T00:00:00.000Z', gte: '2024-01-15T00:00:00.000Z' },
    updated_at: {
      gte: '2024-01-15T00:00:00.000Z',
      lt: '2024-01-15T23:59:59.000Z',
      lte: '2024-01-15T23:59:59.000Z',
    },
    file_url: 'https://cdn.example.com/f.pdf?mime_type=application%2Fpdf',
  },
  response: {
    created_at: '2024-01-15T12:00:00.000Z',
    modified_at: '2024-01-15T12:00:00.000Z',
    date_created: '2024-01-15T12:00:00.000Z',
  },
  attributes: { date: '2024-01-15T12:00:00.000Z' },
  body: {
    created_at: '2024-01-15T12:00:00.000Z',
    due_date: '2024-01-15T12:00:00.000Z',
    issue_date: '2024-01-15T12:00:00.000Z',
    file: 'aGVsbG8=',
  },
  user: { created_on: '2024-01-15T12:00:00.000Z' },
  profile: { last_seen_on: '2024-01-15 12:00:00' },
  personal: { birthDate: '01/15/2024' },
  schedule: { start_time: '09:00:00', stop_time: '17:00:00' },
  last_login: '2024-01-15 12:00:00',
  add_time: '2024-01-15 12:00:00',
  close_date: '01/15/2024',
  absence_date: '2024-01-15',
  accessCreationDateTime: '2024-01-15 12:00:00',
  activated_on: '2024-01-15 12:00:00',
  created_on: '2024-01-15 12:00:00',
  last_updated: '2024-01-15 12:00:00',
  started_on: '2024-01-15 12:00:00',
  internal: { terminationDate: '01/15/2024' },
  work: { activeEffectiveDate: '01/15/2024' },
  payload: {
    headers: [{ name: 'Date', value: 'Mon, 15 Jan 2024 12:00:00 +0000' }],
  },
  $start_date: '2024-01-15',
  $dateStr: '2024-01-15',
  $wm: '2024-01-15',
  $created_at: '2024-01-15T12:00:00.000Z',
  args: { start_date: '2024-01-15' },
  url: 'https://api.example.com/v1/record/99',
  file_url: 'https://cdn.example.com/f.pdf?mime_type=application%2Fpdf',
}

export const PARSE_URL_SCAN_FIXTURE = {
  url: 'https://cdn.example.com/files/doc.pdf?mime_type=application%2Fpdf&token=abc',
  file_url:
    'https://cdn.example.com/files/doc.pdf?mime_type=application%2Fpdf&token=abc',
  rawQuery: {
    file_url:
      'https://cdn.example.com/files/doc.pdf?mime_type=application%2Fpdf',
  },
  query: {
    file_url: 'https://cdn.example.com/files/doc.pdf?mime_type=application%2Fpdf',
  },
}

export const INSTANCE_RETURN_SCAN_FIXTURE = {
  ...PARSE_URL_SCAN_FIXTURE,
  body: { file: 'aGVsbG8=' },
  response: { data: 'SGVsbG8=' },
}

export const WRAPPER_REGRESSION_ERROR =
  /Attempted to invoke a non-function|Cannot read properties of undefined \(reading '(?:toFormat|toUTC|toISO|plus|minus|startOf|endOf|diff|toMillis|origin|pathname|searchParams|type|size|byteLength)'\)/
