import styled from 'styled-components'

const Frame = styled.div`
  --browser-chrome: #e6ecef;
  --browser-controls: #bec4c6;
  --close: #ff8585;
  --minimise: #ffd071;
  --maximise: #74ed94;
  --border-radius-large: 10px;
  --border-radius-small: 3px;
  --control-height: 25px;
  .browser-frame {
    border-radius: var(--border-radius-large);
    overflow: hidden;
    height: calc(100vh - 100px);
    background-color: #fff;
    position: relative;
  }

  iframe {
    width: 100%;
    height: calc(100vh - 150px);
  }

  .browser-controls {
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: space-around;
    background: var(--browser-chrome);
    color: var(--browser-controls);
  }

  .window-controls {
    flex: 0 0 60px;
    margin: 0 2%;

    span {
      display: inline-block;
      width: 15px;
      height: 15px;
      border-radius: 50px;
      background: var(--close);
      margin-right: 4px;

      &.minimise {
        background: var(--minimise);
      }

      &.maximise {
        background: var(--maximise);
      }
    }
  }

  .url-bar {
    flex-grow: 1;
    margin-right: 2%;
    padding: 0 10px;
    color: darken(var(--browser-controls), 20%);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100px;
  }

  .full-screen {
    flex: 0 0 30px;
    margin-right: 2%;

    &:after {
      content: '⤢';
      display: block;
      float: right;
      font-size: 31px;
      line-height: 22px;
      padding: 0px 5px 0 0;
    }
  }

  .white-container {
    height: var(--control-height);
    border-radius: var(--border-radius-small);
    background: white;
  }
`

export const BrowserFrame = ({ url }: { url?: string }) => {
  return (
    <Frame>
      <div className='browser-frame'>
        <div className='browser-controls'>
          <div className='window-controls'>
            <span className='close' />
            <span className='minimise' />
            <span className='maximise' />
          </div>

          <span className='url-bar white-container'>{url}</span>

          <span className='full-screen white-container' />
        </div>
        <div>{url && <iframe src={url} />}</div>
      </div>
    </Frame>
  )
}
