class DataProcessor {
  constructor() {
    this.stats = {
      totalProcessed: 0,
      bookingsFound: 0,
      leadsCreated: 0,
      engagedConversations: 0,
      invalidRecords: 0,
      automationMapping: {}
    };
  }

  /**
   * Process a single Airtable record with exact transformation rules
   */
  processRecord(record) {
    try {
      const fields = record.fields;
      const processedRecord = {
        airtable_id: record.id,
        external_id: fields['User ID'] || null,
        name: fields['Name'] || null,
        clinic: fields['Clinic'] || null,
        email: fields['Email'] || null,
        phone: fields['Phone'] || null,
        conversation_transcript: fields['Conversation Transcript'] || null,
        created_at: this.parseDate(fields['Created']),

        // CRITICAL: Exact data processing rules
        booking_exists: this.checkBookingExists(fields['Booking']),
        lead_created: this.checkLeadCreated(fields['Lead Created']),
        engaged: this.checkEngaged(fields['Engaged in conversation']),

        // Process automation code
        automation_code: this.processAutomationCode(fields['Automation']),

        // Parse booking date if exists
        booking_date: this.parseBookingDate(fields['Booking'])
      };

      // Update statistics
      this.updateStats(processedRecord);

      return processedRecord;
    } catch (error) {
      console.error('Error processing record:', record.id, error.message);
      this.stats.invalidRecords++;
      return null;
    }
  }

  /**
   * CRITICAL: Booking exists when Booking column contains "2025"
   * Expected: exactly 3,122 bookings
   */
  checkBookingExists(bookingField) {
    if (!bookingField) return false;

    const bookingStr = String(bookingField);
    const hasBooking = bookingStr.includes('2025');

    if (hasBooking) {
      this.stats.bookingsFound++;
    }

    return hasBooking;
  }

  /**
   * CRITICAL: Lead created when "Lead Created" field equals exactly "Yes"
   * Expected: exactly 13,908 leads
   */
  checkLeadCreated(leadCreatedField) {
    if (!leadCreatedField) return false;

    const isLead = String(leadCreatedField).trim() === 'Yes';

    if (isLead) {
      this.stats.leadsCreated++;
    }

    return isLead;
  }

  /**
   * CRITICAL: Engaged when "Engaged in conversation" equals "TRUE" or "True" or "true"
   * Expected: exactly 7,910 engaged
   */
  checkEngaged(engagedField) {
    if (!engagedField) return false;

    const engagedStr = String(engagedField).trim();
    const isEngaged = engagedStr === 'TRUE' || engagedStr === 'True' || engagedStr === 'true';

    if (isEngaged) {
      this.stats.engagedConversations++;
    }

    return isEngaged;
  }

  /**
   * Process automation code with exact rules:
   * - Remove UTM parameters (e.g., "WEB?UTM_MEDIUM=ANDY" becomes "WEB")
   * - Map "WEB" to "WB" for consistency
   * - Handle null/missing by defaulting to "DB"
   */
  processAutomationCode(automationField) {
    if (!automationField) {
      return 'DB'; // Default for missing automation
    }

    let code = String(automationField).trim();

    // Remove UTM parameters - everything after ?
    if (code.includes('?')) {
      code = code.split('?')[0];
    }

    // Remove any other query parameters or fragments
    code = code.split('#')[0].split('&')[0];

    // Map WEB to WB for consistency
    if (code === 'WEB') {
      code = 'WB';
    }

    // Validate against known codes, default to DB if invalid
    const validCodes = ['WB', 'IB', 'CB', 'DB', 'EB', 'TB'];
    if (!validCodes.includes(code)) {
      console.warn(`Unknown automation code '${automationField}' -> defaulting to 'DB'`);
      code = 'DB';
    }

    // Track automation mapping for stats
    if (!this.stats.automationMapping[code]) {
      this.stats.automationMapping[code] = 0;
    }
    this.stats.automationMapping[code]++;

    return code;
  }

  /**
   * Check if booking exists without affecting stats (for internal use)
   */
  hasBookingFlag(bookingField) {
    if (!bookingField) return false;
    const bookingStr = String(bookingField);
    return bookingStr.includes('2025');
  }

  /**
   * Parse booking dates from multiple formats:
   * - "Thu Oct 02 2025 18:30:00 GMT+0300"
   * - "2025-09-15T10:00"
   * - Date objects from Airtable
   */
  parseBookingDate(bookingField) {
    if (!bookingField || !this.hasBookingFlag(bookingField)) {
      return null;
    }

    try {
      // If it's already a Date object (from Airtable)
      if (bookingField instanceof Date) {
        return bookingField.toISOString();
      }

      const bookingStr = String(bookingField);

      // Try to extract date from string containing "2025"
      // Look for common patterns

      // Pattern 1: "Thu Oct 02 2025 18:30:00 GMT+0300"
      const gmtMatch = bookingStr.match(/\w{3}\s+\w{3}\s+\d{1,2}\s+2025\s+\d{1,2}:\d{2}:\d{2}/);
      if (gmtMatch) {
        const dateStr = gmtMatch[0];
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
      }

      // Pattern 2: ISO format "2025-09-15T10:00"
      const isoMatch = bookingStr.match(/2025-\d{2}-\d{2}T\d{2}:\d{2}/);
      if (isoMatch) {
        const parsed = new Date(isoMatch[0]);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
      }

      // Pattern 3: Any date with 2025
      const yearMatch = bookingStr.match(/2025-\d{2}-\d{2}/);
      if (yearMatch) {
        const parsed = new Date(yearMatch[0]);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
      }

      // Fallback: try to parse the entire string
      const fallbackParsed = new Date(bookingStr);
      if (!isNaN(fallbackParsed.getTime()) && fallbackParsed.getFullYear() === 2025) {
        return fallbackParsed.toISOString();
      }

      console.warn('Could not parse booking date:', bookingStr);
      return null;
    } catch (error) {
      console.warn('Error parsing booking date:', bookingField, error.message);
      return null;
    }
  }

  /**
   * Parse general date fields (Created field)
   */
  parseDate(dateField) {
    if (!dateField) return null;

    try {
      // If it's already a Date object
      if (dateField instanceof Date) {
        return dateField.toISOString();
      }

      // Try parsing as string
      const parsed = new Date(dateField);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }

      return null;
    } catch (error) {
      console.warn('Error parsing date:', dateField, error.message);
      return null;
    }
  }

  /**
   * Update processing statistics
   */
  updateStats(processedRecord) {
    this.stats.totalProcessed++;

    // Stats are updated in individual check methods:
    // - bookingsFound in checkBookingExists()
    // - leadsCreated in checkLeadCreated()
    // - engagedConversations in checkEngaged()
    // - automationMapping in processAutomationCode()
  }

  /**
   * Get current processing statistics
   */
  getStats() {
    return {
      ...this.stats,
      // Add percentages
      bookingRate: this.stats.totalProcessed > 0 ?
        (this.stats.bookingsFound / this.stats.totalProcessed * 100).toFixed(2) + '%' : '0%',
      leadRate: this.stats.totalProcessed > 0 ?
        (this.stats.leadsCreated / this.stats.totalProcessed * 100).toFixed(2) + '%' : '0%',
      engagementRate: this.stats.totalProcessed > 0 ?
        (this.stats.engagedConversations / this.stats.totalProcessed * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalProcessed: 0,
      bookingsFound: 0,
      leadsCreated: 0,
      engagedConversations: 0,
      invalidRecords: 0,
      automationMapping: {}
    };
  }

  /**
   * Validate expected metrics against actual results
   */
  validateMetrics() {
    const expectedBookings = 3122;
    const expectedLeads = 13908;
    const expectedEngaged = 7910;

    const results = {
      bookings: {
        expected: expectedBookings,
        actual: this.stats.bookingsFound,
        match: this.stats.bookingsFound === expectedBookings
      },
      leads: {
        expected: expectedLeads,
        actual: this.stats.leadsCreated,
        match: this.stats.leadsCreated === expectedLeads
      },
      engaged: {
        expected: expectedEngaged,
        actual: this.stats.engagedConversations,
        match: this.stats.engagedConversations === expectedEngaged
      }
    };

    console.log('\n=== METRICS VALIDATION ===');
    console.log(`Bookings: ${results.bookings.actual}/${results.bookings.expected} ${results.bookings.match ? '✓' : '✗'}`);
    console.log(`Leads: ${results.leads.actual}/${results.leads.expected} ${results.leads.match ? '✓' : '✗'}`);
    console.log(`Engaged: ${results.engaged.actual}/${results.engaged.expected} ${results.engaged.match ? '✓' : '✗'}`);
    console.log('==========================\n');

    return results;
  }
}

module.exports = DataProcessor;