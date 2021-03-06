
	

	DECLARE @template_id int, @content nvarchar(max);
	declare c CURSOR FOR
		select Content, Hermes_Email_Template_Id from dbo.Hermes_Email_Template_Content cont where cont.Hermes_Email_Template_Id in (
			select Id from dbo.Hermes_Email_Template template where (select count(*) from dbo.Hermes_Email_Placeholder placeholder where placeholder.Hermes_Email_Template_Id = template.Id) = 0
		) and Content is not null and len(rtrim(ltrim(Content))) > 0;


	OPEN c;

	fetch next from c into @content, @template_id

	while @@FETCH_STATUS = 0
	begin
		-- select @content

		declare @len int;
		set @len = len(@content);

		declare @pos int;
		set @pos = 1;

		declare @numorder int;
		set @numorder = 1;

		while @pos < @len
		begin
			declare @znak nvarchar(1);
			set @znak = substring(@content, @pos, 1);
			if @znak = '{'
			begin
				declare @konec int;
				set @konec = charindex('}', @content, @pos + 1);

				declare @placeholder nvarchar(254);
				set @placeholder = substring(@content, @pos + 1, @konec - 1 - @pos)

				-- select @placeholder

				declare @popis nvarchar(254);
				set @popis = (select top 1 description from dbo.Hermes_Email_Placeholder where Prop_Name = @placeholder)
				if @popis is null
				begin
					set @popis = @placeholder
				end

				insert into dbo.hermes_email_placeholder (hermes_email_template_id, prop_name, description, num_order)
				values 
				(@template_id, @placeholder, @popis, @numorder)
				set @numorder = @numorder + 1;
				
				set @pos = @konec + 1;
			end;

			set @pos = @pos + 1
		end

		fetch next from c into @content, @template_id
	end
	CLOSE c;  
	DEALLOCATE c;