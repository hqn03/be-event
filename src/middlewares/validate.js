const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    next();
  } catch (err) {
    if (err.name == "ZodError") {
      const errors = JSON.parse(err.message);
      return res.status(400).json({
        message: "Validation error",
        errors: errors.map((e) => {
          return {
            path: e.path[1],
            message: e.message,
          };
        }),
      });
    }
    next(err);
  }
};

export default validate;
