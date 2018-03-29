USE [rts]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

SET ANSI_PADDING ON
GO

CREATE TABLE [dbo].[Item](
	[itemId] [int] IDENTITY(1,1) NOT NULL,
	[meetingId] [int] NOT NULL,
	[itemOrder] [int] NOT NULL,
	[itemName] [varchar](150) NOT NULL,
	[timeToSpeak] [int] NOT NULL,
 CONSTRAINT [PK_Item] PRIMARY KEY CLUSTERED 
(
	[itemId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

CREATE TABLE [dbo].[Request](
	[requestId] [int] IDENTITY(1,1) NOT NULL,
	[meetingId] [int] NOT NULL,
	[dateAdded] [datetime] NOT NULL CONSTRAINT [DF_Request_dateAdded]  DEFAULT (getdate()),
	[firstName] [varchar](50) NOT NULL,
	[lastName] [varchar](50) NOT NULL,
	[official] [bit] NOT NULL,
	[agency] [varchar](50) NULL,
	[item] [int] NULL,
	[offAgenda] [bit] NOT NULL,
	[subTopic] [varchar](50) NULL,
	[stance] [varchar](50) NOT NULL,
	[notes] [varchar](500) NULL,
	[phone] [varchar](50) NULL,
	[email] [varchar](50) NULL,
	[address] [varchar](50) NULL,
	[timeToSpeak] [int] NOT NULL,
	[status] [varchar](50) NOT NULL,
	[approvedForDisplay] [bit] NOT NULL CONSTRAINT [DF_Request_approvedForDisplay]  DEFAULT ((0)),
 CONSTRAINT [PK_Request] PRIMARY KEY CLUSTERED 
(
	[requestId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

CREATE TABLE [dbo].[Meeting](
	[meetingId] [int] IDENTITY(1,1) NOT NULL,
	[sireId] [int] NULL,
	[meetingName] [varchar](50) NOT NULL,
	[meetingDate] [datetime] NOT NULL,
	[status] [varchar](50) NOT NULL CONSTRAINT [DF_Meeting_active]  DEFAULT ((0)),
 CONSTRAINT [PK_Meeting] PRIMARY KEY CLUSTERED 
(
	[meetingId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO

CREATE TYPE [dbo].[ItemsParam] AS TABLE(
	[meetingId] [int] NOT NULL,
	[itemOrder] [int] NOT NULL,
	[itemName] [varchar](150) NOT NULL,
	[timeToSpeak] [int] NOT NULL
)
GO

CREATE PROCEDURE [dbo].[InsertItem]
      @meetingId int,
      @itemOrder int,
      @itemName varchar(150),
      @timeToSpeak int,
	  @id int output
AS
BEGIN
      SET NOCOUNT ON;
      INSERT INTO  Item (meetingId, itemOrder, itemName, timeToSpeak)
	  VALUES (@meetingId, @itemOrder, @itemName, @timeToSpeak)
      SET @id=SCOPE_IDENTITY()
      RETURN  @id
END

GO

CREATE PROCEDURE [dbo].[InsertMeeting]
      @sireId int,
      @meetingName varchar(100),
      @meetingDate datetime,
      @status varchar(50),
	  @id int output
AS
BEGIN
      SET NOCOUNT ON;
      INSERT INTO  Meeting (sireId, meetingName, meetingDate, status)
      VALUES (@sireId, @meetingName, @meetingDate, @status)
      SET @id=SCOPE_IDENTITY()
      RETURN  @id
END

GO

CREATE PROCEDURE [dbo].[InsertRequest]
      @meetingId int,
      @firstName varchar(50),
      @lastName varchar(50),
      @official varchar(50),
	  @agency varchar(50),
	  @item int,
	  @offAgenda bit,
	  @subTopic varchar(50),
	  @stance varchar(50),
	  @notes varchar(300),
	  @phone varchar(50),
	  @email varchar(50),
	  @address varchar(50),
	  @timeToSpeak int,
	  @status varchar(50),
	  @id int output
AS
BEGIN
      SET NOCOUNT ON;
      DECLARE @isOfficial int;
	  IF @official = 'constituent'
		SET @isOfficial = 0
	  ELSE IF @official = 'official'
		SET @isOfficial = 1
	  ELSE
		SET @isOfficial = @official
	   
	  INSERT INTO  Request (meetingId, firstName, lastName, official, agency, item,
	  offAgenda, subTopic, stance, notes, phone, email, address, timeToSpeak, status)
      VALUES ( @meetingId, @firstName, @lastName, @isOfficial, @agency, @item, 
	  @offAgenda, @subTopic, @stance, @notes, @phone, @email, @address, @timeToSpeak, @status)
      SET @id=SCOPE_IDENTITY()
      RETURN  @id
END

GO

CREATE PROCEDURE [dbo].[UpdateMeeting](
	@meetingId int,
	@meetingName varchar(100),
	@meetingDate datetime,
	@tvpItems [dbo].[ItemsParam] READONLY
)
AS
BEGIN
	SET NOCOUNT ON;

	UPDATE Meeting SET meetingName = @meetingName, meetingDate = @meetingDate
	WHERE meetingId = @meetingId

	DELETE FROM Item where meetingId = @meetingId

	INSERT INTO dbo.Item (meetingId, itemOrder, itemName, timeToSpeak)  
    SELECT i.meetingId, i.itemOrder, i.itemName, i.timeToSpeak FROM @tvpItems AS i; 
END

GO

CREATE PROCEDURE [dbo].[UpdateRequest]
      @requestId int,
      @firstName varchar(50),
      @lastName varchar(50),
      @official varchar(50),
	  @agency varchar(50),
	  @item int,
	  @offAgenda bit,
	  @subTopic varchar(50),
	  @stance varchar(50),
	  @notes varchar(300),
	  @phone varchar(50),
	  @email varchar(50),
	  @address varchar(50),
	  @status varchar(50),
	  @timeToSpeak int,
	  @approvedForDisplay bit
AS
BEGIN
      SET NOCOUNT ON;
      DECLARE @isOfficial int;
	  IF @official = 'constituent'
		SET @isOfficial = 0
	  ELSE IF @official = 'official'
		SET @isOfficial = 1
	  ELSE
		SET @isOfficial = @official
	   
	  UPDATE Request SET firstName = @firstName, lastName = @lastName, official = @isOfficial,
		agency = @agency, item = @item, offAgenda = @offAgenda, subTopic = @subTopic, 
		stance = @stance, notes = @notes, phone = @phone, email = @email, address = @address,
		status = @status, timeToSpeak = @timeToSpeak, @approvedForDisplay = @approvedForDisplay
		WHERE requestId = @requestId
END

GO

SET ANSI_PADDING OFF
GO
