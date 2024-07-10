import React from 'react';
import PropTypes from 'prop-types';

const Popup = ({ message, show, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-md">
        <h3 className="text-lg font-semibold mb-4">{message}</h3>
        <button
          onClick={onClose}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200"
        >
          Close
        </button>
      </div>
    </div>
  );
};

Popup.propTypes = {
  message: PropTypes.string.isRequired,
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Popup;
