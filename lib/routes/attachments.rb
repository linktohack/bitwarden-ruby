#
# Copyright (c) 2017 joshua stein <jcs@jcs.org>
#
# Permission to use, copy, modify, and distribute this software for any
# purpose with or without fee is hereby granted, provided that the above
# copyright notice and this permission notice appear in all copies.
#
# THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
# WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
# MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
# ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
# WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
# ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
# OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
#

# TODO
## implement attachment_url helper
## implement retrieve_cipher helper
## figure out id generation
## implement cipher.add_attachment
## implement cipher.remove_attachment
module BitwardenRuby
  module Routing
    module Attachments
      def self.registered(app)
        attachments_path = File.expand_path("data/attachments", app.root)
        app.namespace BASE_URL do
          post "/ciphers/:uuid/attachment" do
            cipher = retrieve_cipher uuid: params[:uuid], token: ...
            filename = params[:data][:filename]
            file = params[:data][:tempfile]
            id = "XXX-to-figure-out-XXX"
            target = File.expand_path(id, attachments_path)
            return validation_error("invalid data") if File.dirname(target) != attachments_path
            File.open target, 'wb' do |f|
              f.write(file.read)
            end
            cipher.add_attachment attachment: {
              Id: id,
              filename: filename,
              Url: attachment_url(uuid: uuid, id: id),
              Size: file.size,
              SieName: human_file_size(file.size)
            }

            cipher.to_hash.to_json
          end

          delete "/ciphers/:uuid/attachment/:attachment_id" do
            cipher = retrieve_cipher uuid: params[:uuid], token: ...
            cipher.remove_attachment attachment_id: params[:attachment_id]

            ""
          end
        end
      end
    end
  end
end