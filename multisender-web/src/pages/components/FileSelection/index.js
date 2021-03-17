import React, { useState, useRef } from 'react';
import styled from 'styled-components';

const HiddenFileInput = styled.input`
    display: none;
`;
const FileInput = styled.div`
    display: inline-block;
    width: ${props => props.buttonStyle['width'] || '40%'} !important;
    height: 30px;
    line-height: 30px;
    text-align: center;
    font-size: 16px;
    border-radius: 20px;
    border: 1px solid #c3c3c3;
    color: #c3c3c3 !important;
    background: transparent;
    margin-left: 10px;
    margin-bottom: 10px;

    cursor: pointer;

    &::after {
        content: 'Browse';
        height: 28px;
        line-height: 28px;
        font-size: 14px;
        color: black;
        float: right;
        padding: 0em 1em;
        border-radius: 15px;
        background: #c3c3c3;
    }
    &:hover::after {
        background: linear-gradient(90deg, #29307C 0%, #414EDD 100%) !important;
    }
`;
const FileName = styled.span`
    display: inline-block;
    width: calc(100% - 8em);
    overflow: hidden;
    text-overflow: ellipsis;
`;

function FileSelection(props) {
    const [fileName, setFileName] = useState();
    const fileEl = useRef(null);
    const clickFun = (e) => { fileEl.current.click(); }
    const onChange = (e) => {
        setFileName(e.target.files.length > 0 ? e.target.files[0].name : undefined);
        props.onChange(e);
    }

    return (
        <div>
            <HiddenFileInput id={props.id} onChange={onChange} type="file" ref={fileEl} />
            <FileInput buttonStyle={props.buttonStyle || {}} onClick={clickFun}><FileName>{fileName || props.placeholder}</FileName></FileInput>
        </div>
    )
}
export default FileSelection;
