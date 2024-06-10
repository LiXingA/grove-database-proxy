import React, { useCallback } from "react";
import { useDropzone } from 'react-dropzone';
import _ from 'lodash';
const AllAccept = ".json"
export default function MyDropzone(props) {
  const { handleFilesFunc, className, children, input, accept, ...propsa } = _.assign({
    className: '',
    handleFilesFunc: (acceptedFiles) => {
      acceptedFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onabort = () => console.log('file reading was aborted')
        reader.onerror = () => console.log('file reading has failed')
        reader.onload = () => {
          const binaryStr = reader.result
          console.log(binaryStr)
        }
        reader.readAsArrayBuffer(file)
      })
    },
    accept: AllAccept,
  }, props);
  const onDrop = useCallback(handleFilesFunc, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept, ...propsa })
  return (
    <div className={className} {...getRootProps(input ? { className: `dropzone ${className || ""}` } : undefined)}>
      {
        isDragActive && <p className="drag-notice"><b>Drop the files here ...</b></p>
      }
      {input ? <input {...getInputProps()} /> : ""}
      {children}
    </div>
  )
}

export function Basic(props) {
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone();

  const files = acceptedFiles.map(file => (
    <li key={file.path}>
      {file.path} - {file.size} bytes
    </li>
  ));

  return (
    <section className="container">
      <div {...getRootProps({ className: 'dropzone' })}>
        <input {...getInputProps()} />
        <p>Drag 'n' drop some files here, or click to select files</p>
      </div>
      <aside>
        <h4>Files</h4>
        <ul>{files}</ul>
      </aside>
    </section>
  );
}
