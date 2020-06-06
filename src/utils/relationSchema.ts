const relationSchema = {
  start: {
    indexed: true,
    type: "string",
  },

  type: {
    indexed: true,
    type: "string",
  },

  end: {
    indexed: true,
    type: "string",
  },

  to: {
    indexed: true,
    type: "string",
  },

  from: {
    indexed: true,
    type: "string",
  },
};

export default relationSchema;
