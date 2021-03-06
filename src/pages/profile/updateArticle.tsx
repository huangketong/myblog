import * as React from 'react';
import { connect } from 'react-redux';
import QueueAnim from 'rc-queue-anim';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { EditorState, convertToRaw, ContentState, convertFromRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import draftToMarkdown from 'draftjs-to-markdown';
import htmlToDraft from 'html-to-draftjs';
import { Input, Button, Row, Col, Switch, Icon, Modal, message, Tabs } from 'antd';
const TabPane = Tabs.TabPane;
const { TextArea } = Input;
import './detail.less';
import { request } from '../../util/request';
import 'whatwg-fetch';
import {
    GET_ARTICLE_SINGLE,
    UPDATE_RECORD
} from '../../action/profileAction';
const marked = require('marked');

interface updateProps {
    article?: any,
    dispatch: any
}

class UpdateArticle extends React.Component<updateProps, any>{
    constructor(props) {
        super(props);
        this.state = {
            editorState: undefined,
            articleTitle: null,
            articleSummary: null,
            articleContent: '',
            isMarkdown: false, // 是否启用Markdown语法，默认false 不启用
        }
    }
    componentWillMount() {
        const { article, dispatch } = this.props;
        let tmp;
        if (!article.id) {
            tmp = JSON.parse(sessionStorage.getItem('singleArticle'));
        }

        const isMarkdown = article.id ? article.isMarkdown : tmp.isMarkdown;
        const articleTitle = article.id ? article.title : tmp.title;
        const articleContent = article.id ? article.content : tmp.content;
        const articleSummary = article.id ? article.summary : tmp.summary;

        /*  https://github.com/jpuri/html-to-draftjs
            https://github.com/jpuri/react-draft-wysiwyg/issues/417
        */
        const blocksFromHtml = htmlToDraft(articleContent);
        const { contentBlocks, entityMap } = blocksFromHtml;
        const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
        const editorState = EditorState.createWithContent(contentState);

        this.setState({
            isMarkdown,
            articleTitle,
            articleContent,
            editorState,
            articleSummary
        });
    }
    onEditorStateChange = (editorState) => {
        this.setState({
            editorState,
            articleContent: draftToHtml(convertToRaw(editorState.getCurrentContent()))
        })
    }
    handleInput = (e) => {
        let value = e.target.value;
        this.setState({
            articleTitle: value
        });
    }
    handleSummary = (e) => {
        let value = e.target.value;
        this.setState({
            articleSummary: value
        });
    }
    handleCommit = () => {
        const {
            articleTitle,
            articleSummary,
            articleContent,
            isMarkdown
        } = this.state;
        const { article, dispatch } = this.props;

        // 判断是否已经输入标题和内容
        if (articleTitle && articleContent) {
            let tmp;
            if (article.id) {
                let params = {
                    ...article,
                    title: articleTitle,
                    summary: articleSummary,
                    content: articleContent,
                    isMarkdown: isMarkdown
                };
                dispatch({ type: UPDATE_RECORD, params: params });
            } else {
                tmp = JSON.parse(sessionStorage.getItem('singleArticle'));
                let params = {
                    ...tmp,
                    title: articleTitle,
                    summary: articleSummary,
                    content: articleContent,
                    isMarkdown: isMarkdown
                };

                dispatch({ type: UPDATE_RECORD, params: params });
            }
        } else {
            message.warning('标题、概要和内容都必填');
        }

    }
    uploadCallback(file) {
        let formData = new FormData();
        formData.append('image', file);

        return new Promise(
            (resolve, reject) => {
                fetch('http://127.0.0.1:7001/news/upload', {
                    method: 'POST',
                    body: formData,
                }).then(res => {
                    return res.json()
                }).then(res => {
                    console.log('res:', res);
                    resolve({ data: { link: res.url } })
                }).catch(err => {
                    console.log('err', err)
                    reject(err)
                })
            }
        );
    }

    onChangeTextArea = (e) => {
        this.setState({
            articleContent: e.target.value
        })
    }

    render() {
        const {
            article
        } = this.props;
        const {
            editorState,
            articleContent,
            articleTitle,
            isMarkdown,
            articleSummary
        } = this.state;

        const toolbarConfig = {
            options: ['inline', 'blockType', 'fontSize', 'fontFamily', 'list', 'textAlign', 'colorPicker', 'link', 'emoji', 'image', 'remove', 'history'],
            image: {
                // 上传本地图片到云
                // uploadCallback: this.uploadCallback,
                inputAccept: 'image/gif,image/jpeg,image/jpg,image/png,image/svg',
            }
        };
        const editorStyle = {
            border: '1px solid #F1F1F1',
            padding: 5,
            borderRadius: 2,
            minHeight: 340,
        };

        return (
            <QueueAnim delay={400}>
                <div key='update'>
                    <div key='newArticle'>
                        <div className='titleContent'>
                            <p>文章标题:</p>
                            <div >
                                <Input style={{ width: '50%' }}
                                    onChange={this.handleInput}
                                    size='large'
                                    value={articleTitle}
                                />
                            </div>
                        </div>
                        <div className='Summary'>
                            <p>文章概要:</p>
                            <div >
                                <TextArea
                                    placeholder='请输入文章概要'
                                    onChange={this.handleSummary}
                                    value={articleSummary}
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className='articleContent'>
                            <p>文章内容:</p>
                            {
                                isMarkdown ?
                                    <Tabs>
                                        <TabPane tab='输入' key='1'>
                                            <TextArea rows={18} placeholder='使用Markdown语法'
                                                onChange={this.onChangeTextArea}
                                                value={articleContent}
                                            />
                                        </TabPane>
                                        <TabPane tab='预览' key='2'>
                                            <div style={{ border: '1px solid #ddd', minHeight: 400, padding: 12, overflow: 'auto' }}>
                                                <div dangerouslySetInnerHTML={{ __html: marked(articleContent) }}></div>
                                            </div>
                                        </TabPane>
                                    </Tabs>
                                    :
                                    <Editor
                                        localization={{ locale: 'zh' }}
                                        wrapperClassName="wrapper-class"
                                        editorClassName="editor-class"
                                        toolbarClassName="toolbar-class"
                                        editorState={editorState}
                                        onEditorStateChange={this.onEditorStateChange}
                                        toolbar={toolbarConfig}
                                        editorStyle={editorStyle}
                                    />
                            }

                            <textarea
                                style={{ display: 'none' }}
                                disabled
                                value={draftToHtml(convertToRaw(editorState.getCurrentContent()))}
                            />
                        </div>
                        <div className='tagContent'>

                        </div>
                        <div>
                            <Button type='primary'
                                onClick={this.handleCommit}
                            >提交</Button>
                        </div>
                    </div>
                </div>
            </QueueAnim>
        )
    }
}

function mapStateToProps(state: any) {
    const data = state.get('profilePage');
    return {
        article: data.get('article').toJS(),
    }
}

export default connect(mapStateToProps)(UpdateArticle);